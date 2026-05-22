# backend/trust.py
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

def compute_trust_score(answer: str, chunks: list) -> dict:
    if not chunks or answer == "INSUFFICIENT CONTEXT":
        return {
            "score": 0.0,
            "grounded_sentences": 0,
            "total_sentences": 0,
            "label": "No match",
            "color": "#E24B4A"
        }

    # Step 1 — split answer into sentences
    sentences = [s.strip() for s in answer.split(".") if s.strip()]
    if not sentences:
        return {"score": 0.0, "grounded_sentences": 0,
                "total_sentences": 0, "label": "No match", "color": "#E24B4A"}

    # Step 2 — embed sentences and chunks
    sentence_embeddings = model.encode(sentences)
    chunk_embeddings = model.encode(chunks)

    # Step 3 — for each sentence find max similarity to any chunk
    grounded = 0
    grounded_flags = []
    for sent_emb in sentence_embeddings:
        similarities = cosine_similarity([sent_emb], chunk_embeddings)[0]
        max_sim = float(np.max(similarities))
        is_grounded = max_sim > 0.4
        grounded_flags.append(is_grounded)
        if is_grounded:
            grounded += 1

    # Step 4 — calculate score
    score = grounded / len(sentences)

    # Step 5 — label and color
    if score >= 0.7:
        label, color = "High confidence", "#1D9E75"
    elif score >= 0.4:
        label, color = "Medium confidence", "#EF9F27"
    else:
        label, color = "Low confidence", "#E24B4A"

    return {
        "score": round(score, 2),
        "grounded_sentences": grounded,
        "total_sentences": len(sentences),
        "label": label,
        "color": color,
        "grounded_flags": grounded_flags
    }