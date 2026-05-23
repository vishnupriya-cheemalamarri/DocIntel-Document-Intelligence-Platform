# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import router
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="DocIntel — Document Intelligence API",
    description="Upload any document, ask questions, get grounded answers",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://doc-intel-document-intelligence-pla.vercel.app",
        "http://localhost:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "DocIntel API running", "version": "2.0.0"}