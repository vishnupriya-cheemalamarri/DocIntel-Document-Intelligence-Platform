import os
import requests
from typing import List

def build_prompt(question: str, context_chunks: List[str]) -> str:
    context = "\n".join(context_chunks)
    return f"Context: {context}\n\nQuestion: {question}\nAnswer:"

def generate_answer(question: str, context_chunks: List[str]) -> str:
    prompt = build_prompt(question, context_chunks)
    api_key = os.getenv("GROQ_API_KEY")
    
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "Answer strictly based on the context provided. If the answer is not present in the context, say INSUFFICIENT CONTEXT. Never make up information."},
                {"role": "user", "content": prompt}
            ]
        }
    )
    
    data = response.json()
    
    # Show full response if something goes wrong
    if "choices" not in data:
        raise Exception(f"Groq API error: {data}")
    
    return data["choices"][0]["message"]["content"]