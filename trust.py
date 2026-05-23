# # backend/trust.py
# from embedder import get_model
# from sklearn.metrics.pairwise import cosine_similarity
# import numpy as np


# def compute_trust_score(answer: str, chunks: list) -> dict:
#     if not chunks or answer == "INSUFFICIENT CONTEXT":
#         return {
#             "score": 0.0,
#             "grounded_sentences": 0,
#             "total_sentences": 0,
#             "label": "No match",
#             "color": "#E24B4A"
#         }

#     # Step 1 — split answer into sentences
#     sentences = [s.strip() for s in answer.split(".") if s.strip()]
#     if not sentences:
#         return {"score": 0.0, "grounded_sentences": 0,
#                 "total_sentences": 0, "label": "No match", "color": "#E24B4A"}

#     # Step 2 — embed sentences and chunks
#     sentence_embeddings = get_model().encode(sentences)
#     chunk_embeddings = get_model().encode(chunks)

#     # Step 3 — for each sentence find max similarity to any chunk
#     grounded = 0
#     grounded_flags = []
#     for sent_emb in sentence_embeddings:
#         similarities = cosine_similarity([sent_emb], chunk_embeddings)[0]
#         max_sim = float(np.max(similarities))
#         is_grounded = max_sim > 0.4
#         grounded_flags.append(is_grounded)
#         if is_grounded:
#             grounded += 1

#     # Step 4 — calculate score
#     score = grounded / len(sentences)

#     # Step 5 — label and color
#     if score >= 0.7:
#         label, color = "High confidence", "#1D9E75"
#     elif score >= 0.4:
#         label, color = "Medium confidence", "#EF9F27"
#     else:
#         label, color = "Low confidence", "#E24B4A"

#     return {
#         "score": round(score, 2),
#         "grounded_sentences": grounded,
#         "total_sentences": len(sentences),
#         "label": label,
#         "color": color,
#         "grounded_flags": grounded_flags
#     }
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def compute_trust_score(answer: str, chunks: list) -> dict:
    if not chunks or answer == "INSUFFICIENT CONTEXT":
        return {"score": 0.0, "grounded_sentences": 0,
                "total_sentences": 0, "label": "No match", "color": "#E24B4A"}

    sentences = [s.strip() for s in answer.split(".") if s.strip()]
    if not sentences:
        return {"score": 0.0, "grounded_sentences": 0,
                "total_sentences": 0, "label": "No match", "color": "#E24B4A"}

    all_texts = sentences + chunks
    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        matrix = vectorizer.fit_transform(all_texts)
    except Exception:
        return {"score": 0.5, "grounded_sentences": len(sentences),
                "total_sentences": len(sentences), "label": "Medium confidence", "color": "#EF9F27"}

    sent_vecs = matrix[:len(sentences)]
    chunk_vecs = matrix[len(sentences):]

    grounded = 0
    for i in range(len(sentences)):
        sims = cosine_similarity(sent_vecs[i], chunk_vecs)[0]
        if np.max(sims) > 0.15:
            grounded += 1

    score = grounded / len(sentences)

    if score >= 0.7:
        label, color = "High confidence", "#1D9E75"
    elif score >= 0.4:
        label, color = "Medium confidence", "#EF9F27"
    else:
        label, color = "Low confidence", "#E24B4A"

    return {"score": round(score, 2), "grounded_sentences": grounded,
            "total_sentences": len(sentences), "label": label, "color": color}