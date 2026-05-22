# retriever.py
from typing import List, Dict
from embedder import search

def retrieve_clauses(questions: List[str], top_k: int = 5) -> Dict[str, List[str]]:
    result = {}
    for q in questions:
        top_chunks = search(q, top_k=top_k)
        result[q] = top_chunks
    return result

def retrieve_single(question: str, top_k: int = 3) -> List[str]:
    return search(question, top_k=top_k)