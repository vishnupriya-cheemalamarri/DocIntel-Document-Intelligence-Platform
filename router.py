# router.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List
import tempfile
import os
from parser import parse_document
from embedder import chunk_text, embed_chunks
from retriever import retrieve_single
from llm import generate_answer
from trust import compute_trust_score

router = APIRouter()

class QueryRequest(BaseModel):
    document_url: str
    question: str

class QueryResponse(BaseModel):
    answer: str
    chunks_used: List[str]
    trust: dict

@router.post("/query", response_model=QueryResponse)
async def query_document(payload: QueryRequest):
    try:
        # Step 1 - parse document
        raw_text = parse_document(payload.document_url)
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Document is empty or unreadable")

        # Step 2 - chunk and embed
        chunks = chunk_text(raw_text)
        embed_chunks(chunks)

        # Step 3 - retrieve relevant chunks
        relevant_chunks = retrieve_single(payload.question)

        # Step 4 - generate answer
        answer = generate_answer(payload.question, relevant_chunks)

        # Real trust score
        trust = compute_trust_score(answer, relevant_chunks)

        return {
            "answer": answer,
            "chunks_used": relevant_chunks,
            "trust": trust
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))