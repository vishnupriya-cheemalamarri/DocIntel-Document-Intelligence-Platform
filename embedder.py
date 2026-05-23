# # embedder.py
# import os
# import chromadb
# from sentence_transformers import SentenceTransformer
# from typing import List, Tuple
# from dotenv import load_dotenv
# load_dotenv()

# EMBEDDING_MODEL = "all-MiniLM-L6-v2"
# CHUNK_SIZE = 300
# COLLECTION_NAME = "documents"

# _model = None

# def get_model():
#     global _model
#     if _model is None:
#         _model = SentenceTransformer(EMBEDDING_MODEL)
#     return _model

# client = chromadb.PersistentClient(path="./chroma_db")

# def chunk_text(text: str) -> List[str]:
#     paragraphs = text.split("\n\n")
#     chunks, buffer = [], ""
#     for para in paragraphs:
#         if len(buffer) + len(para) < CHUNK_SIZE:
#             buffer += para + "\n\n"
#         else:
#             if buffer.strip():
#                 chunks.append(buffer.strip())
#             buffer = para + "\n\n"
#     if buffer.strip():
#         chunks.append(buffer.strip())
#     return chunks

# def embed_chunks(chunks: List[str], collection_name: str = COLLECTION_NAME):
#     embeddings = get_model().encode(chunks).tolist()
#     # Delete and recreate collection to clear old data
#     try:
#         client.delete_collection(collection_name)
#     except:
#         pass
#     col = client.get_or_create_collection(collection_name)
#     col.add(
#         documents=chunks,
#         embeddings=embeddings,
#         ids=[f"chunk_{i}" for i in range(len(chunks))],
#         metadatas=[{"source": "uploaded", "chunk": i} for i in range(len(chunks))]
#     )

# def search(query: str, collection_name: str = COLLECTION_NAME, top_k: int = 5) -> List[str]:
#     q_embed = get_model().encode([query]).tolist()
#     col = client.get_collection(collection_name)
#     results = col.query(query_embeddings=q_embed, n_results=top_k)
#     return results["documents"][0]
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CHUNK_SIZE = 300
_store = {"chunks": [], "vectorizer": None, "matrix": None}

def chunk_text(text: str):
    paragraphs = text.split("\n\n")
    chunks, buffer = [], ""
    for para in paragraphs:
        if len(buffer) + len(para) < CHUNK_SIZE:
            buffer += para + "\n\n"
        else:
            if buffer.strip():
                chunks.append(buffer.strip())
            buffer = para + "\n\n"
    if buffer.strip():
        chunks.append(buffer.strip())
    return chunks if chunks else [text[:CHUNK_SIZE]]

def embed_chunks(chunks):
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(chunks)
    _store["chunks"] = chunks
    _store["vectorizer"] = vectorizer
    _store["matrix"] = matrix

def search(query: str, top_k: int = 3):
    if _store["matrix"] is None:
        return []
    q_vec = _store["vectorizer"].transform([query])
    scores = cosine_similarity(q_vec, _store["matrix"])[0]
    top_indices = np.argsort(scores)[::-1][:top_k]
    return [_store["chunks"][i] for i in top_indices]