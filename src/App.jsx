import { useState, useRef, useEffect } from "react";

// SmartDesk AI — Joe's Barbershop demo (deployed version)
// The widget calls /api/chat, a Vercel serverless function that
// holds the Anthropic API key server-side.

const NAVY = "#10213F";
const NAVY_LIGHT = "#1B3158";
const ACCENT = "#C8A24A";

const SUGGESTIONS = [
  "What are your hours?",
  "How much is a haircut?",
  "Can I book an appointment?",
];

function ChatIcon({ open }) {
  return open ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.08.89 3.97 2.35 5.4-.18 1.1-.62 2.3-1.45 3.3-.18.22-.02.55.26.52 1.9-.2 3.42-.88 4.5-1.55.99.33 2.1.53 3.34.53 4.97 0 9-3.58 9-8.2S16.97 3 12 3z" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#9AA4B5",
            animation: "sdPulse 1.2s infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi there! I'm the SmartDesk assistant for Joe's Barbershop on Main Street in Mountain Top. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || "Empty response");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError("Couldn't reach the assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <>
      <style>{`
        @keyframes sdPulse { 0%,60%,100% { opacity:.3; transform:translateY(0);} 30% { opacity:1; transform:translateY(-3px);} }
        @keyframes sdRise { from { opacity:0; transform:translateY(14px) scale(.98);} to { opacity:1; transform:translateY(0) scale(1);} }
        .sd-input:focus { outline: 2px solid ${NAVY}; outline-offset: -2px; }
        .sd-send:disabled { opacity:.45; cursor:default; }
        .sd-chip:hover { background:${NAVY}; color:#fff; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {open && (
        <div
          role="dialog"
          aria-label="Chat with Joe's Barbershop"
          style={{
            position: "fixed",
            bottom: 96,
            right: 24,
            width: "min(370px, calc(100vw - 32px))",
            height: "min(560px, calc(100vh - 130px))",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 24px 64px rgba(16,33,63,.32)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "sdRise .22s ease",
            zIndex: 1000,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div style={{ background: NAVY, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: NAVY_LIGHT,
                border: `2px solid ${ACCENT}`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: ".5px",
                flexShrink: 0,
              }}
            >
              JB
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>Joe's Barbershop</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 0 3px rgba(52,211,153,.25)" }} />
                <span style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>Online · replies instantly</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, opacity: 0.8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 14px", background: "#F6F7FA" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    background: m.role === "user" ? NAVY : "#fff",
                    color: m.role === "user" ? "#fff" : "#1D2433",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    boxShadow: m.role === "user" ? "none" : "0 1px 3px rgba(16,33,63,.08)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#fff", borderRadius: "16px 16px 16px 4px", boxShadow: "0 1px 3px rgba(16,33,63,.08)" }}>
                  <TypingDots />
                </div>
              </div>
            )}
            {error && <div style={{ textAlign: "center", color: "#B4232A", fontSize: 12, marginTop: 6 }}>{error}</div>}
            {showSuggestions && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="sd-chip"
                    onClick={() => send(s)}
                    style={{
                      border: `1px solid ${NAVY}`,
                      color: NAVY,
                      background: "#fff",
                      borderRadius: 999,
                      padding: "7px 13px",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid #E6E9F0", background: "#fff", padding: 10, display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              className="sd-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Write a message…"
              aria-label="Message"
              style={{
                flex: 1,
                border: "1px solid #DDE2EB",
                borderRadius: 10,
                padding: "11px 13px",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />
            <button
              className="sd-send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              style={{
                background: NAVY,
                border: "none",
                borderRadius: 10,
                width: 44,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M3.4 20.4l17.4-7.5c.8-.35.8-1.45 0-1.8L3.4 3.6c-.66-.29-1.39.2-1.39.92L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .72.73 1.2 1.39.91z" />
              </svg>
            </button>
          </div>

          <div style={{ background: "#fff", textAlign: "center", paddingBottom: 8, fontSize: 11, color: "#8B93A5" }}>
            Powered by <span style={{ fontWeight: 700, color: NAVY }}>SmartDesk AI</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: NAVY,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(16,33,63,.4)",
          zIndex: 1001,
        }}
      >
        <ChatIcon open={open} />
      </button>
    </>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#FBF9F4", fontFamily: "'Inter', system-ui, sans-serif", color: "#23201A" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 6vw", borderBottom: "1px solid #E9E4D8" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>
          Joe's <span style={{ color: "#A6342B" }}>Barbershop</span>
        </div>
        <div style={{ fontSize: 14, color: "#6B6457" }}>Main Street · Mountain Top, PA</div>
      </nav>

      <header style={{ padding: "11vh 6vw 9vh", maxWidth: 880 }}>
        <div style={{ fontSize: 13, letterSpacing: "2.5px", textTransform: "uppercase", color: "#A6342B", fontWeight: 600, marginBottom: 16 }}>
          Est. on Main Street
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(38px, 6vw, 64px)", lineHeight: 1.08, margin: 0 }}>
          A proper cut, the old-fashioned way.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: "#5C564A", maxWidth: 540, marginTop: 22 }}>
          Sharp fades, clean trims, and good conversation in the heart of Mountain Top.
          Appointments recommended — walk-ins always welcome.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, padding: "0 6vw 12vh", maxWidth: 1100 }}>
        {[
          { title: "Haircut", price: "$25", desc: "Classic or modern — cut, lined up, and styled." },
          { title: "Beard Trim", price: "$15", desc: "Shaped, edged, and finished with hot towel." },
          { title: "Hours", price: "Tue–Sat", desc: "Closed Sunday & Monday. Book ahead or just stop in." },
        ].map((c) => (
          <div key={c.title} style={{ background: "#fff", border: "1px solid #E9E4D8", borderRadius: 12, padding: "26px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0 }}>{c.title}</h3>
              <span style={{ color: "#A6342B", fontWeight: 700, fontSize: 18 }}>{c.price}</span>
            </div>
            <p style={{ color: "#6B6457", fontSize: 14, lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>{c.desc}</p>
          </div>
        ))}
      </section>

      <footer style={{ borderTop: "1px solid #E9E4D8", padding: "22px 6vw", fontSize: 13, color: "#8A8270" }}>
        Joe's Barbershop · Main Street, Mountain Top, PA · Customer support by SmartDesk AI
      </footer>

      <ChatWidget />
    </div>
  );
}
