import { useState, useRef, useEffect } from "react";

const NAVY = "#10213F";
const NAVY_LIGHT = "#1B3158";

// ── BUSINESS CONFIGURATIONS ──────────────────────────────────────────────────
const BUSINESSES = {
  barbershop: {
    id: "barbershop",
    name: "Joe's Barbershop",
    tagline: "A proper cut, the old-fashioned way.",
    description: "Sharp fades, clean trims, and good conversation in the heart of Mountain Top. Appointments recommended — walk-ins always welcome.",
    location: "Main Street · Mountain Top, PA",
    accent: "#A6342B",
    accentLight: "#f9f0ef",
    avatar: "JB",
    avatarColor: "#C8A24A",
    greeting: "Hi there! I'm the SmartDesk assistant for Joe's Barbershop on Main Street in Mountain Top. How can I help you today?",
    suggestions: ["What are your hours?", "How much is a haircut?", "Can I book an appointment?"],
    services: [
      { title: "Haircut", price: "$25", desc: "Classic or modern — cut, lined up, and styled." },
      { title: "Beard Trim", price: "$15", desc: "Shaped, edged, and finished with hot towel." },
      { title: "Hours", price: "Tue–Sat", desc: "Closed Sunday & Monday. Book ahead or just stop in." },
    ],
    footer: "Joe's Barbershop · Main Street, Mountain Top, PA · Customer support by SmartDesk AI",
  },
  dental: {
    id: "dental",
    name: "Mountain Top Dental",
    tagline: "Healthy smiles for the whole family.",
    description: "Comprehensive dental care for patients of all ages. From routine cleanings to cosmetic procedures, we keep Mountain Top smiling.",
    location: "Oak Street · Mountain Top, PA",
    accent: "#1a6b9a",
    accentLight: "#eef5fb",
    avatar: "MTD",
    avatarColor: "#34b8d4",
    greeting: "Hello! I'm the SmartDesk assistant for Mountain Top Dental on Oak Street. I can help you schedule an appointment or answer questions about our services. How can I help?",
    suggestions: ["What services do you offer?", "Do you accept insurance?", "Can I book a cleaning?"],
    services: [
      { title: "Cleaning", price: "$120", desc: "Full cleaning, exam, and X-rays. Most insurance accepted." },
      { title: "Whitening", price: "$250", desc: "Professional in-office whitening treatment." },
      { title: "Hours", price: "Mon–Fri", desc: "8am–5pm weekdays. Saturday by appointment only." },
    ],
    footer: "Mountain Top Dental · Oak Street, Mountain Top, PA · Patient support by SmartDesk AI",
  },
};

// ── TYPING DOTS ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9AA4B5", animation: "sdPulse 1.2s infinite", animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

// ── CHAT WIDGET ──────────────────────────────────────────────────────────────
function ChatWidget({ business }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: business.greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: business.greeting }]);
    setInput(""); setError(null); setOpen(false);
  }, [business.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setError(null); setInput("");
    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next); setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), businessId: business.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || "Empty response");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError("Couldn't reach the assistant. Please try again.");
    } finally { setLoading(false); }
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <>
      <style>{`
        @keyframes sdPulse{0%,60%,100%{opacity:.3;transform:translateY(0);}30%{opacity:1;transform:translateY(-3px);}}
        @keyframes sdRise{from{opacity:0;transform:translateY(14px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}
        .sd-input:focus{outline:2px solid ${NAVY};outline-offset:-2px;}
        .sd-send:disabled{opacity:.45;cursor:default;}
        .sd-chip:hover{background:${NAVY};color:#fff;}
      `}</style>
      {open && (
        <div style={{ position:"fixed", bottom:96, right:24, width:"min(370px,calc(100vw - 32px))", height:"min(560px,calc(100vh - 130px))", background:"#fff", borderRadius:16, boxShadow:"0 24px 64px rgba(16,33,63,.32)", display:"flex", flexDirection:"column", overflow:"hidden", animation:"sdRise .22s ease", zIndex:1000, fontFamily:"'Inter',system-ui,sans-serif" }}>
          <div style={{ background:NAVY, padding:"16px 18px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:NAVY_LIGHT, border:`2px solid ${business.avatarColor}`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, flexShrink:0 }}>{business.avatar}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#fff", fontWeight:600, fontSize:15 }}>{business.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#34D399" }} />
                <span style={{ color:"rgba(255,255,255,.75)", fontSize:12 }}>Online · replies instantly</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:6, opacity:.8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"16px 14px", background:"#F6F7FA" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:10 }}>
                <div style={{ maxWidth:"82%", padding:"10px 14px", fontSize:14, lineHeight:1.5, whiteSpace:"pre-wrap", background:m.role==="user"?NAVY:"#fff", color:m.role==="user"?"#fff":"#1D2433", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", boxShadow:m.role==="user"?"none":"0 1px 3px rgba(16,33,63,.08)" }}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{ display:"flex", justifyContent:"flex-start" }}><div style={{ background:"#fff", borderRadius:"16px 16px 16px 4px", boxShadow:"0 1px 3px rgba(16,33,63,.08)" }}><TypingDots/></div></div>}
            {error && <div style={{ textAlign:"center", color:"#B4232A", fontSize:12, marginTop:6 }}>{error}</div>}
            {showSuggestions && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
                {business.suggestions.map((s) => (
                  <button key={s} className="sd-chip" onClick={() => send(s)} style={{ border:`1px solid ${NAVY}`, color:NAVY, background:"#fff", borderRadius:999, padding:"7px 13px", fontSize:13, cursor:"pointer", transition:"all .15s" }}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ borderTop:"1px solid #E6E9F0", background:"#fff", padding:10, display:"flex", gap:8 }}>
            <input ref={inputRef} className="sd-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && send()} placeholder="Write a message…" style={{ flex:1, border:"1px solid #DDE2EB", borderRadius:10, padding:"11px 13px", fontSize:14, fontFamily:"inherit" }}/>
            <button className="sd-send" onClick={() => send()} disabled={loading || !input.trim()} style={{ background:NAVY, border:"none", borderRadius:10, width:44, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3.4 20.4l17.4-7.5c.8-.35.8-1.45 0-1.8L3.4 3.6c-.66-.29-1.39.2-1.39.92L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .72.73 1.2 1.39.91z"/></svg>
            </button>
          </div>
          <div style={{ background:"#fff", textAlign:"center", paddingBottom:8, fontSize:11, color:"#8B93A5" }}>Powered by <span style={{ fontWeight:700, color:NAVY }}>SmartDesk AI</span></div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} style={{ position:"fixed", bottom:24, right:24, width:60, height:60, borderRadius:"50%", background:NAVY, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(16,33,63,.4)", zIndex:1001 }}>
        {open ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg> : <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M12 3C7.03 3 3 6.58 3 11c0 2.08.89 3.97 2.35 5.4-.18 1.1-.62 2.3-1.45 3.3-.18.22-.02.55.26.52 1.9-.2 3.42-.88 4.5-1.55.99.33 2.1.53 3.34.53 4.97 0 9-3.58 9-8.2S16.97 3 12 3z"/></svg>}
      </button>
    </>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [conversations] = useState([
    { id:1, customer:"Mike T.", intent:"Book haircut — Saturday 10am", outcome:"Booked", code:"SD-4821", time:"2:14 AM", business:"Joe's Barbershop" },
    { id:2, customer:"Anonymous", intent:"Pricing for beard trim", outcome:"Answered", code:"—", time:"11:52 PM", business:"Joe's Barbershop" },
    { id:3, customer:"Sarah K.", intent:"Book cleaning — Monday 2pm", outcome:"Booked", code:"MTD-3942", time:"10:31 PM", business:"Mountain Top Dental" },
    { id:4, customer:"Dave R.", intent:"Do you accept insurance?", outcome:"Answered", code:"—", time:"9:05 PM", business:"Mountain Top Dental" },
    { id:5, customer:"Unknown", intent:"Wedding party group booking", outcome:"Escalated", code:"—", time:"8:47 PM", business:"Joe's Barbershop" },
  ]);

  const connectCalendar = () => {
    setConnecting(true);
    window.location.href = "/api/auth/google";
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      setCalendarConnected(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const tabs = ["overview", "conversations", "calendar", "settings"];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:16, width:"min(960px,95vw)", height:"min(680px,92vh)", display:"flex", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,.3)" }}>

        {/* SIDEBAR */}
        <div style={{ width:200, background:NAVY, display:"flex", flexDirection:"column", padding:"20px 0", flexShrink:0 }}>
          <div style={{ padding:"0 20px 20px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:8 }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>SmartDesk AI</div>
            <div style={{ color:"rgba(255,255,255,.4)", fontSize:11, marginTop:2 }}>Business Dashboard</div>
          </div>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", fontSize:13, fontWeight:500, color:activeTab===t?"#fff":"rgba(255,255,255,.45)", background:activeTab===t?"rgba(255,255,255,.08)":"transparent", border:"none", borderLeft:`3px solid ${activeTab===t?"#C8A24A":"transparent"}`, cursor:"pointer", textAlign:"left", textTransform:"capitalize" }}>
              {t}
            </button>
          ))}
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ margin:"0 12px 12px", padding:"8px", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:8, color:"rgba(255,255,255,.6)", fontSize:12, cursor:"pointer" }}>← Back to site</button>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1, overflowY:"auto", background:"#F6F7FA" }}>

          {/* OVERVIEW TAB */}
          {activeTab==="overview" && (
            <div style={{ padding:28 }}>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:20, fontWeight:700, color:NAVY }}>Good morning 👋</div>
                <div style={{ fontSize:13, color:"#64748b", marginTop:3 }}>Here's what your AI agents did recently</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
                {[["24","Conversations today","↑ 3 from yesterday","#E6F7F2","#0F7B55"],["11","Appointments booked","82% resolution rate","#EEF3FB","#1F4E79"],["9","After-hours handled","Outside business hours","#FFF8E6","#B45309"]].map(([val,label,sub,bg,color])=>(
                  <div key={label} style={{ background:"#fff", borderRadius:10, border:"1px solid #E2E8F0", padding:18 }}>
                    <div style={{ fontSize:11, color:"#64748b", fontWeight:500, marginBottom:8 }}>{label}</div>
                    <div style={{ fontSize:28, fontWeight:700, color:NAVY }}>{val}</div>
                    <div style={{ fontSize:11, marginTop:4, color }}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#fff", borderRadius:10, border:"1px solid #E2E8F0", overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:13, fontWeight:600, color:NAVY }}>Recent conversations</span>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr style={{ background:"#F8F9FC" }}>{["Customer","Business","Request","Outcome","Time"].map(h=><th key={h} style={{ padding:"10px 18px", textAlign:"left", color:"#64748b", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:".05em" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {conversations.map((c,i)=>(
                      <tr key={c.id} style={{ borderTop:"1px solid #F0F2F7", background:i%2===0?"#fff":"#FAFBFC" }}>
                        <td style={{ padding:"10px 18px", fontWeight:600, color:NAVY }}>{c.customer}</td>
                        <td style={{ padding:"10px 18px", color:"#64748b" }}>{c.business}</td>
                        <td style={{ padding:"10px 18px", color:"#3a3d4a" }}>{c.intent}</td>
                        <td style={{ padding:"10px 18px" }}>
                          <span style={{ padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:600, background:c.outcome==="Booked"?"#E6F7F2":c.outcome==="Answered"?"#EEF3FB":"#FFF8E6", color:c.outcome==="Booked"?"#0F7B55":c.outcome==="Answered"?"#1F4E79":"#B45309" }}>{c.outcome}</span>
                        </td>
                        <td style={{ padding:"10px 18px", color:"#64748b" }}>{c.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONVERSATIONS TAB */}
          {activeTab==="conversations" && (
            <div style={{ padding:28 }}>
              <div style={{ fontSize:20, fontWeight:700, color:NAVY, marginBottom:6 }}>Conversation History</div>
              <div style={{ fontSize:13, color:"#64748b", marginBottom:24 }}>All customer interactions across your configured agents</div>
              {conversations.map((c)=>(
                <div key={c.id} style={{ background:"#fff", borderRadius:10, border:"1px solid #E2E8F0", padding:18, marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontWeight:600, color:NAVY, fontSize:14 }}>{c.customer}</div>
                      <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{c.business} · {c.time}</div>
                    </div>
                    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600, background:c.outcome==="Booked"?"#E6F7F2":c.outcome==="Answered"?"#EEF3FB":"#FFF8E6", color:c.outcome==="Booked"?"#0F7B55":c.outcome==="Answered"?"#1F4E79":"#B45309" }}>{c.outcome}</span>
                  </div>
                  <div style={{ marginTop:10, fontSize:13, color:"#3a3d4a" }}>{c.intent}</div>
                  {c.code!=="—" && <div style={{ marginTop:6, fontSize:11, color:"#C8A24A", fontWeight:600 }}>Confirmation: {c.code}</div>}
                </div>
              ))}
            </div>
          )}

          {/* CALENDAR TAB */}
          {activeTab==="calendar" && (
            <div style={{ padding:28 }}>
              <div style={{ fontSize:20, fontWeight:700, color:NAVY, marginBottom:6 }}>Google Calendar</div>
              <div style={{ fontSize:13, color:"#64748b", marginBottom:24 }}>Connect your calendar so SmartDesk AI can check real availability and create bookings automatically</div>
              {calendarConnected ? (
                <div style={{ background:"#E6F7F2", border:"1px solid #0F7B55", borderRadius:10, padding:24, marginBottom:20 }}>
                  <div style={{ fontWeight:600, color:"#0F7B55", fontSize:15, marginBottom:4 }}>✓ Google Calendar Connected</div>
                  <div style={{ fontSize:13, color:"#0F7B55" }}>Your calendar is linked. The AI agent will now check real availability and create confirmed bookings automatically.</div>
                </div>
              ) : (
                <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:10, padding:24, marginBottom:20 }}>
                  <div style={{ fontWeight:600, color:NAVY, fontSize:15, marginBottom:8 }}>Connect Google Calendar</div>
                  <div style={{ fontSize:13, color:"#64748b", marginBottom:20, lineHeight:1.6 }}>
                    When connected, SmartDesk AI will:<br/>
                    • Check your real calendar availability before offering time slots<br/>
                    • Create confirmed calendar events when a customer books<br/>
                    • Send automatic reminders to customers before their appointment
                  </div>
                  <button onClick={connectCalendar} disabled={connecting} style={{ background:connecting?"#64748b":NAVY, color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:connecting?"wait":"pointer", display:"flex", alignItems:"center", gap:8 }}>
                    {connecting ? "Connecting..." : "Connect Google Calendar"}
                  </button>
                </div>
              )}
              <div style={{ background:"#FFF8E6", border:"1px solid #F59E0B", borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:600, color:"#B45309", fontSize:13, marginBottom:4 }}>Note on Calendar Integration</div>
                <div style={{ fontSize:12, color:"#B45309", lineHeight:1.6 }}>Full Google Calendar OAuth is implemented. After connecting, your availability will be fetched in real time for every booking request. The simulated availability used in the demo phase will be replaced by your live calendar data.</div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab==="settings" && (
            <div style={{ padding:28 }}>
              <div style={{ fontSize:20, fontWeight:700, color:NAVY, marginBottom:6 }}>Agent Settings</div>
              <div style={{ fontSize:13, color:"#64748b", marginBottom:24 }}>Configure your SmartDesk AI agents</div>
              {Object.values(BUSINESSES).map(b=>(
                <div key={b.id} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:10, padding:20, marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ fontWeight:600, color:NAVY, fontSize:15 }}>{b.name}</div>
                    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600, background:"#E6F7F2", color:"#0F7B55" }}>Active</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[["Location",b.location],["Hours",b.services.find(s=>s.title==="Hours")?.price||""]].map(([label,val])=>(
                      <div key={label}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>{label}</div>
                        <div style={{ fontSize:13, color:NAVY, background:"#F6F7FA", borderRadius:6, padding:"8px 10px" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>Embed Code</div>
                    <div style={{ fontSize:11, background:"#F0F2F7", borderRadius:6, padding:"10px 12px", fontFamily:"monospace", color:"#3a3d4a", wordBreak:"break-all" }}>
                      {`<script src="https://smartdesk-ai.vercel.app/embed.js" data-business="${b.id}"></script>`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedBusiness, setSelectedBusiness] = useState("barbershop");
  const [showDashboard, setShowDashboard] = useState(false);
  const business = BUSINESSES[selectedBusiness];

  return (
    <div style={{ minHeight:"100vh", background:business.accentLight, fontFamily:"'Inter',system-ui,sans-serif", color:"#23201A", transition:"background .3s" }}>

      {/* SELECTOR BANNER */}
      <div style={{ background:NAVY, padding:"10px 6vw", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ color:"rgba(255,255,255,.7)", fontSize:12, fontWeight:500 }}>SmartDesk AI Demo — Select a business:</span>
          {Object.values(BUSINESSES).map((b) => (
            <button key={b.id} onClick={() => setSelectedBusiness(b.id)} style={{ padding:"6px 16px", borderRadius:999, border:`2px solid ${selectedBusiness===b.id?b.avatarColor:"rgba(255,255,255,.3)"}`, background:selectedBusiness===b.id?b.avatarColor:"transparent", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .2s" }}>{b.name}</button>
          ))}
        </div>
        <button onClick={() => setShowDashboard(true)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,.3)", background:"rgba(255,255,255,.1)", color:"#fff", fontSize:12, fontWeight:500, cursor:"pointer" }}>
          Owner Dashboard →
        </button>
      </div>

      {/* NAV */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 6vw", borderBottom:"1px solid #E9E4D8" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700 }}>
          {business.name.split(" ").slice(0,-1).join(" ")} <span style={{ color:business.accent }}>{business.name.split(" ").slice(-1)}</span>
        </div>
        <div style={{ fontSize:14, color:"#6B6457" }}>{business.location}</div>
      </nav>

      {/* HERO */}
      <header style={{ padding:"11vh 6vw 9vh", maxWidth:880 }}>
        <div style={{ fontSize:13, letterSpacing:"2.5px", textTransform:"uppercase", color:business.accent, fontWeight:600, marginBottom:16 }}>{business.location}</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(38px,6vw,64px)", lineHeight:1.08, margin:0 }}>{business.tagline}</h1>
        <p style={{ fontSize:17, lineHeight:1.65, color:"#5C564A", maxWidth:540, marginTop:22 }}>{business.description}</p>
      </header>

      {/* SERVICES */}
      <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:18, padding:"0 6vw 12vh", maxWidth:1100 }}>
        {business.services.map((c) => (
          <div key={c.title} style={{ background:"#fff", border:"1px solid #E9E4D8", borderRadius:12, padding:"26px 24px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, margin:0 }}>{c.title}</h3>
              <span style={{ color:business.accent, fontWeight:700, fontSize:18 }}>{c.price}</span>
            </div>
            <p style={{ color:"#6B6457", fontSize:14, lineHeight:1.6, marginTop:10, marginBottom:0 }}>{c.desc}</p>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid #E9E4D8", padding:"22px 6vw", fontSize:13, color:"#8A8270" }}>{business.footer}</footer>

      {showDashboard && <Dashboard onClose={() => setShowDashboard(false)} />}
      <ChatWidget business={business} />
    </div>
  );
}
