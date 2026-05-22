import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8000/api/v1/query";

type Result = { answer: string; chunks_used: string[] };

const trust = (answer: string, chunks: string[]) => {
  if (answer === "INSUFFICIENT CONTEXT") return { pct: 10, label: "No match", color: "#E24B4A" };
  if (chunks.length >= 3) return { pct: 85, label: "High confidence", color: "#1D9E75" };
  if (chunks.length === 2) return { pct: 60, label: "Medium confidence", color: "#EF9F27" };
  return { pct: 35, label: "Low confidence", color: "#E24B4A" };
};

// Animated floating orbs background
const Orbs = () => (
  <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
    {[
      { w: 600, h: 600, top: "-10%", left: "-10%", color: "rgba(127,119,221,0.15)", dur: "20s" },
      { w: 500, h: 500, top: "30%", right: "-5%", color: "rgba(216,90,48,0.12)", dur: "25s" },
      { w: 400, h: 400, bottom: "-5%", left: "30%", color: "rgba(29,158,117,0.12)", dur: "18s" },
    ].map((o, i) => (
      <div key={i} style={{
        position: "absolute", width: o.w, height: o.h,
        top: o.top, left: o.left, right: (o as any).right, bottom: (o as any).bottom,
        background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
        animation: `float ${o.dur} ease-in-out infinite alternate`,
        animationDelay: `${i * 3}s`,
      }} />
    ))}
  </div>
);

// Typing animation hook
const useTyping = (texts: string[], speed = 60) => {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    const timer = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        } else {
          setTimeout(() => setDeleting(true), 1800);
        }
      } else {
        if (charIdx > 0) {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        } else {
          setDeleting(false);
          setIdx(i => (i + 1) % texts.length);
        }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, texts, speed]);

  return displayed;
};

export default function App() {
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const typed = useTyping([
    "What are the payment terms?",
    "Summarize this contract.",
    "What happens if payment is late?",
    "Who owns the IP rights?",
    "What is the termination clause?",
  ]);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => p < 85 ? p + Math.random() * 8 : p);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [loading]);

  useEffect(() => {
    if (result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [result]);

  const ask = async () => {
    if (!url.trim() || !question.trim()) {
      setError("Please provide both a document URL and a question.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post(API, { document_url: url, question });
      setResult(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const t = result ? trust(result.answer, result.chunks_used) : null;

  return (
    <>
      <style>{`
        @keyframes float {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, -30px) scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(20px);
        }
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 14px 18px;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.3); }
        .input-field:focus {
          border-color: rgba(127,119,221,0.6);
          background: rgba(255,255,255,0.09);
        }
        .ask-btn {
          background: linear-gradient(135deg, #7F77DD, #D85A30);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 28px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          white-space: nowrap;
          font-family: inherit;
        }
        .ask-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .ask-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .chunk-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: border-color 0.2s;
        }
        .chunk-card:hover { border-color: rgba(127,119,221,0.3); }
        .label-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
        }
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #7F77DD;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
          margin-left: 2px;
        }
      `}</style>

      {/* Deep dark background */}
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 40%, #0a1510 100%)",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
      }}>
        <Orbs />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "48px 20px 80px" }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 48 }} className="fade-up">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 40, padding: "6px 16px 6px 6px",
              marginBottom: 28,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#7F77DD,#D85A30)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>⚡</div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>AI-Powered Document Intelligence</span>
            </div>

            <h1 style={{
              fontSize: 72, fontWeight: 700, margin: "0 0 16px",
              letterSpacing: -3, lineHeight: 1,
              background: "linear-gradient(135deg, #fff 30%, rgba(127,119,221,0.8) 60%, rgba(29,158,117,0.8) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>DocIntel</h1>

            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", margin: "0 0 8px", fontWeight: 400 }}>
              Upload any document. Ask anything.
            </p>
            <p style={{
              fontSize: 18, fontWeight: 500,
              background: "linear-gradient(135deg,#7F77DD,#D85A30)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Trust the answer.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}
            className="fade-up">
            {[
              { val: "PDF · DOCX · Email", label: "Supported formats", icon: "📄" },
              { val: "RAG + Groq", label: "Intelligence engine", icon: "🧠" },
              { val: "Grounded answers", label: "No hallucinations", icon: "✓" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Input card */}
          <div className="card fade-up" style={{ padding: 28, marginBottom: 16 }}>
            <div className="label-text">Document URL</div>
            <input
              className="input-field"
              style={{ marginBottom: 20 }}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/contract.pdf"
            />

            <div className="label-text">Your question</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  className="input-field"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                  placeholder={typed}
                />
              </div>
              <button className="ask-btn" onClick={ask} disabled={loading}>
                {loading ? "Thinking..." : "Ask →"}
              </button>
            </div>

            {/* Progress bar */}
            {loading && (
              <div style={{
                height: 3, background: "rgba(255,255,255,0.08)",
                borderRadius: 2, marginTop: 20, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: "linear-gradient(90deg,#7F77DD,#D85A30)",
                  width: `${progress}%`,
                  transition: "width 0.4s ease",
                }} />
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="card fade-up" style={{ padding: 32, textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-flex", marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg,#7F77DD,#D85A30)",
                  animation: "pulse-ring 1.2s ease infinite",
                  position: "absolute", inset: 0,
                }} />
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg,#7F77DD,#D85A30)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, position: "relative",
                }}>🔍</div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>
                Parsing document, retrieving relevant chunks...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="fade-up" style={{
              background: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)",
              borderRadius: 14, padding: "14px 18px",
              color: "#F09595", fontSize: 14, marginBottom: 16,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div ref={resultRef} className="card fade-up" style={{ padding: 28 }}>
              {/* Trust score */}
              {t && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 20,
                }}>
                  <span className="label-text" style={{ margin: 0 }}>✦ Answer</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 120, height: 4, background: "rgba(255,255,255,0.08)",
                      borderRadius: 2, overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", width: `${t.pct}%`,
                        background: t.color, borderRadius: 2,
                        transition: "width 1s ease",
                      }} />
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: t.color, border: `1px solid ${t.color}33`,
                      borderRadius: 20, padding: "3px 12px",
                      background: `${t.color}15`,
                    }}>
                      {t.label} · {t.pct}%
                    </span>
                  </div>
                </div>
              )}

              <p style={{
                fontSize: 15, lineHeight: 1.8,
                color: "rgba(255,255,255,0.85)", margin: "0 0 24px",
              }}>
                {result.answer}
              </p>

              {result.chunks_used.length > 0 && (
                <>
                  <div style={{
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    paddingTop: 20,
                  }}>
                    <div className="label-text">
                      Sources used · {result.chunks_used.length} chunks
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {result.chunks_used.map((chunk, i) => (
                        <div key={i} className="chunk-card">
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            background: "linear-gradient(135deg,#7F77DD,#D85A30)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            flexShrink: 0, paddingTop: 2,
                          }}>
                            [{i + 1}]
                          </span>
                          <p style={{
                            fontSize: 12, color: "rgba(255,255,255,0.4)",
                            lineHeight: 1.7, margin: 0,
                          }}>
                            {chunk.slice(0, 280)}
                            {chunk.length > 280 && <span style={{ color: "rgba(255,255,255,0.2)" }}> ...</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <p style={{
            textAlign: "center", color: "rgba(255,255,255,0.15)",
            fontSize: 12, marginTop: 40,
          }}>
            DocIntel · Answers grounded in your documents · Built with RAG + Groq
          </p>
        </div>
      </div>
    </>
  );
}