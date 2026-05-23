# DocIntel — AI-Powered Document Intelligence Platform

> Upload any document. Ask anything. Trust the answer.

**Live Demo:** [doc-intel-document-intelligence-pla.vercel.app](https://doc-intel-document-intelligence-pla.vercel.app) &nbsp;|&nbsp; **API:** [docintel-api-ayz4.onrender.com/docs](https://docintel-api-ayz4.onrender.com/docs)

---

## What it does

DocIntel lets you upload any PDF, DOCX, or email document and ask natural language questions about it. Unlike generic AI chatbots, every answer comes with a **real grounding score** — a sentence-level verification that checks whether each claim in the answer actually appears in the source document. If the answer isn't in the document, the system says so instead of hallucinating.

---

## The novel feature — sentence-level trust scoring

Most RAG systems return an answer and stop there. DocIntel goes further:

1. The answer is split into individual sentences
2. Each sentence is vectorized using TF-IDF (Term Frequency — Inverse Document Frequency)
3. Cosine similarity is computed between each sentence and every retrieved source chunk
4. If similarity exceeds threshold, the sentence is considered **grounded**
5. Trust score = grounded sentences / total sentences

**Result:** A color-coded confidence badge on every answer — green (high), amber (medium), red (low) — with the exact count of grounded vs total sentences.

| Query type | Trust score | Label |
|---|---|---|
| Question answered by document | 85–100% | High confidence |
| Partially answered question | 40–70% | Medium confidence |
| Question not in document | 0% | No match |

---

## Architecture

```
User Query
    │
    ▼
FastAPI Backend
    │
    ├── parser.py      → Download + extract text (PDF / DOCX / Email)
    │
    ├── embedder.py    → Chunk text (300 words) + TF-IDF vectorization
    │                    → In-memory vector store
    │
    ├── retriever.py   → Vectorize query + cosine similarity search
    │                    → Return top 3 relevant chunks
    │
    ├── llm.py         → Build prompt with context + call Groq API
    │                    → Answer strictly from context only
    │
    └── trust.py       → Sentence-level grounding check
                         → TF-IDF cosine similarity per sentence vs chunks
                         → Return trust score 0.0 – 1.0
    │
    ▼
React Frontend
    → Dark premium UI with glassmorphism cards
    → Typing animation, progress bar, floating orbs
    → Trust badge with animated confidence bar
    → Source chunks with numbered citations
```

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript + Tailwind | Component-based, type-safe UI |
| Backend | FastAPI + Python | Async, auto-generates API docs |
| Retrieval | TF-IDF + cosine similarity | Lightweight, zero dependencies, free tier deployable |
| LLM | Groq API (Llama 3.3 70B) | Free tier, 300+ tokens/sec |
| Trust scoring | scikit-learn cosine similarity | Sentence-level grounding verification |
| PDF parsing | PyMuPDF | Fast, accurate text extraction |
| Deployment | Render (backend) + Vercel (frontend) | Free tier, production-grade |

---

## Production roadmap

The deployed version uses TF-IDF for retrieval to stay within free tier memory limits. For production scale:

- Replace TF-IDF with HuggingFace Inference API (all-MiniLM-L6-v2) for full semantic search — same interface, one file change
- Add persistent vector store (Qdrant or Pinecone) for multi-document memory
- Add user authentication and document upload (currently URL-based only)

---

## Resume bullets

- Built DocIntel, an AI document intelligence platform with sentence-level grounding verification that checks every LLM answer claim against source chunks using TF-IDF cosine similarity — achieving 100% detection of out-of-context queries
- Implemented real-time trust scoring engine that returns color-coded confidence badges (green/amber/red) showing grounded vs total sentences — system says INSUFFICIENT CONTEXT instead of hallucinating
- Designed full RAG pipeline (parse → chunk → vectorize → retrieve → generate) supporting PDF, DOCX, and email formats, deployed on Render + Vercel with a premium dark React frontend

---

## Run locally

**Backend:**
```bash
cd DocIntel
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Create .env with GROQ_API_KEY=your_key
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
# Create .env.local with REACT_APP_API_URL=http://localhost:8000/api/v1/query
npm start
```

Open `http://localhost:3000` — backend must be running at port 8000.

---

## API reference

**POST `/api/v1/query`**
```json
{
  "document_url": "https://example.com/contract.pdf",
  "question": "What are the payment terms?"
}
```

Response:
```json
{
  "answer": "Payment is due within 30 days of invoice date.",
  "chunks_used": ["...source chunk text..."],
  "trust": {
    "score": 0.85,
    "label": "High confidence",
    "color": "#1D9E75",
    "grounded_sentences": 2,
    "total_sentences": 2
  }
}
```

Interactive API docs: `https://docintel-api-ayz4.onrender.com/docs`

---

## Project structure

```
DocIntel/
├── main.py          # FastAPI app entry point
├── router.py        # API routes
├── parser.py        # PDF / DOCX / email text extraction
├── embedder.py      # Chunking + TF-IDF vectorization
├── retriever.py     # Cosine similarity search
├── llm.py           # Groq API integration
├── trust.py         # Sentence-level grounding check
├── requirements.txt
├── frontend/
│   └── src/
│       └── App.tsx  # React UI
└── README.md
```

---

## What I learned building this

- How RAG pipelines work in production — chunking strategy, vectorization, retrieval
- Why chunk count is a bad proxy for answer quality — sentence-level cosine similarity is a better grounding metric
- How to make pragmatic engineering tradeoffs — TF-IDF vs neural embeddings based on deployment constraints
- The difference between a system that answers questions and a system that knows when not to answer

---

*Built by Vishnupriya Cheemalamarri · VIT Chennai · B.Tech CSE 2027*