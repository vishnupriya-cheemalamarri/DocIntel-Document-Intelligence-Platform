# embedder.py
import os
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Tuple
from dotenv import load_dotenv
load_dotenv()

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 300
COLLECTION_NAME = "documents"

model = SentenceTransformer(EMBEDDING_MODEL)
client = chromadb.PersistentClient(path="./chroma_db")

def chunk_text(text: str) -> List[str]:
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
    return chunks

def embed_chunks(chunks: List[str], collection_name: str = COLLECTION_NAME):
    embeddings = model.encode(chunks).tolist()
    # Delete and recreate collection to clear old data
    try:
        client.delete_collection(collection_name)
    except:
        pass
    col = client.get_or_create_collection(collection_name)
    col.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"chunk_{i}" for i in range(len(chunks))],
        metadatas=[{"source": "uploaded", "chunk": i} for i in range(len(chunks))]
    )

def search(query: str, collection_name: str = COLLECTION_NAME, top_k: int = 5) -> List[str]:
    q_embed = model.encode([query]).tolist()
    col = client.get_collection(collection_name)
    results = col.query(query_embeddings=q_embed, n_results=top_k)
    return results["documents"][0]