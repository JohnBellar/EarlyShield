import { useState, useEffect } from "react";
import {
  ShieldCheck, LayoutDashboard, MessageSquare, Info,
  Cpu, ShieldAlert, History, Send, Trash2,
  Activity, AlertTriangle, CheckCircle2, Shield,
  Sparkles, Menu, ArrowUpRight, Clock
} from "lucide-react";

import "./App.css";

type Risk = "SAFE" | "SUSPICIOUS" | "HIGH RISK";

type Message = {
  sender: "scammer" | "victim";
  text: string;
  prediction?: Prediction;
};



type Prediction = {
  text: string;
  risk: Risk;
  risk_confidence: number;
  risk_probabilities: Record<string, number>;
  tactics: { label: string; confidence: number }[];
  tactic_probabilities?: Record<string, number>;
};

type DashboardStats = {
  total_analyzed: number;
  risk_distribution: { SAFE: number; SUSPICIOUS: number; "HIGH RISK": number };
  tactic_frequency: Record<string, number>;
};

type HistoryItem = {
  id: number;
  message: string;
  risk: Risk;
  risk_confidence: number;
  risk_probabilities?: Record<string, number>;
  tactics?: { label: string; confidence: number }[];
  created_at: string;
};

async function analyzeMessage(text: string): Promise<Prediction> {
  const response = await fetch("http://127.0.0.1:8000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Backend error (${response.status}): ${detail}`);
  }

  return response.json() as Promise<Prediction>;
}

const tactics = [
  "Urgency",
  "Fear / Threat",
  "Credential Request",
  "Emotional Manipulation",
  "Financial Request",
  "Impersonation",
  "Suspicious Link",
  "Reward / Prize",
];


/** Extract the final SCAMMER turn from a cumulative transcript saved by the simulator. */
function getLatestScammerMessage(transcript: string): string {
  const turns = transcript
    .split(/<\/s>\s*/i)
    .map((turn) => turn.trim())
    .filter(Boolean);
  const scammerTurns = turns.filter((turn) => /^SCAMMER\s*:/i.test(turn));
  const latest = scammerTurns[scammerTurns.length - 1];
  return latest ? latest.replace(/^SCAMMER\s*:\s*/i, "").trim() : transcript.trim();
}

function formatConversation(transcript: string): string {
  return transcript
    .split(/<\/s>\s*/i)
    .map((turn) => turn.trim())
    .filter(Boolean)
    .join("\n\n");
}

function riskClass(risk?: Risk) {
  return risk === "HIGH RISK" ? "risk-high" : risk === "SUSPICIOUS" ? "risk-suspicious" : "risk-safe";
}
function App() {
  const [page, setPage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Chat Assistant", icon: MessageSquare },
    { name: "Conversation Simulator", icon: Activity },
    { name: "Model Info", icon: Cpu },
    { name: "Safety Tips", icon: ShieldAlert },
    { name: "History", icon: History },
    { name: "About", icon: Info },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-shield">
            <ShieldCheck size={38} />
          </div>
          <h1>Early<span>Shield</span></h1>
          <p>Detect · Analyze · Stay Safe</p>
        </div>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={`nav-item ${page === item.name ? "active" : ""}`}
                onClick={() => {
                  setPage(item.name);
                  setMobileMenu(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <ShieldCheck size={25} />
          <div>
            <strong>Stay Alert,</strong>
            <p>Stay Protected</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu />
          </button>

          <div>
            <h2>Welcome to <span>EarlyShield!</span></h2>
            <p>Your AI-powered scam detection companion</p>
          </div>

          <div className="topbar-right">
            <span className="model-badge">
              <span className="status-dot" /> Model Ready
            </span>
            <span className="version">v1.0.0</span>
          </div>
        </header>

        {page === "Dashboard" && <Dashboard setPage={setPage} />}
        {page === "Chat Assistant" && <ChatAssistant />}
        {page === "Conversation Simulator" && <ConversationSimulator />}
        {page === "Model Info" && <ModelInfo />}
        {page === "Safety Tips" && <SafetyTips />}
        {page === "History" && <HistoryPage />}
        {page === "About" && <About />}
      </main>
    </div>
  );
}

function Dashboard({ setPage }: { setPage: (p: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<HistoryItem[]>([]);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsResponse, historyResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/dashboard/stats"),
          fetch("http://127.0.0.1:8000/api/history"),
        ]);
        if (!statsResponse.ok || !historyResponse.ok) {
          throw new Error("Could not load dashboard data. Check the backend.");
        }
        const statsData: DashboardStats = await statsResponse.json();
        const historyData: HistoryItem[] = await historyResponse.json();
        setStats(statsData);
        setRecent(historyData.slice(0, 5));
      } catch (error) {
        setDashboardError(error instanceof Error ? error.message : "Dashboard loading failed.");
      }
    }
    loadDashboard();
  }, []);

  const tacticLabels: Record<string, string> = {
    urgency: "Urgency", fear_threat: "Fear / Threat",
    credential_request: "Credential Request",
    emotional_manipulation: "Emotional Manipulation",
    financial_request: "Financial Request", impersonation: "Impersonation",
    suspicious_link: "Suspicious Link", reward_prize: "Reward / Prize",
  };
  const tacticEntries = Object.entries(stats?.tactic_frequency ?? {});
  const maxTacticCount = Math.max(1, ...tacticEntries.map(([, count]) => count));

  return (
    <>
      {dashboardError && <div className="panel analysis-error"><strong>Dashboard couldn't load</strong><p>{dashboardError}</p></div>}
      <section className="stats-grid">
        <Stat icon={MessageSquare} label="Messages Analyzed" value={String(stats?.total_analyzed ?? 0)} color="blue" />
        <Stat icon={ShieldCheck} label="Safe Messages" value={String(stats?.risk_distribution.SAFE ?? 0)} color="green" />
        <Stat icon={AlertTriangle} label="Suspicious" value={String(stats?.risk_distribution.SUSPICIOUS ?? 0)} color="amber" />
        <Stat icon={ShieldAlert} label="High Risk" value={String(stats?.risk_distribution["HIGH RISK"] ?? 0)} color="red" />
      </section>

      <section className="dashboard-grid">
        <div className="panel recent-panel">
          <PanelTitle icon={Clock} title="Recent Activity" />
          {recent.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={35} /><p>No messages analyzed yet.</p>
              <button className="primary-button" onClick={() => setPage("Chat Assistant")}>Analyze a message <ArrowUpRight size={16} /></button>
            </div>
          ) : (
            <div className="recent-list">
              {recent.map((item) => (
                <div className="recent-item" key={item.id}>
                  <div>
                    <strong className={`risk-text ${item.risk === "HIGH RISK" ? "risk-high" : item.risk === "SUSPICIOUS" ? "risk-suspicious" : "risk-safe"}`}>{item.risk}</strong>
                    <p>{getLatestScammerMessage(item.message).length > 90 ? `${getLatestScammerMessage(item.message).slice(0, 90)}…` : getLatestScammerMessage(item.message)}</p>
                    <small>{new Date(item.created_at).toLocaleString()}</small>
                  </div>
                </div>
              ))}
              <button className="ghost-button" onClick={() => setPage("History")}>View all history <ArrowUpRight size={16} /></button>
            </div>
          )}
        </div>

        <div className="panel tactic-panel">
          <PanelTitle icon={Activity} title="Tactic Overview" />
          {tacticEntries.length === 0 ? <p className="muted-note">Tactic statistics will update after model analysis.</p> : (
            <div className="tactic-count-list">
              {tactics.map((tactic) => {
                const key = Object.keys(tacticLabels).find((label) => tacticLabels[label] === tactic);
                const count = key ? stats?.tactic_frequency[key] ?? 0 : 0;
                const width = (count / maxTacticCount) * 100;
                return (
                  <div className="tactic-count-row" key={tactic}>
                    <div className="tactic-count-label"><span>{tactic}</span><strong>{count}</strong></div>
                    <div className="tactic-count-track"><div className="tactic-count-fill" style={{ width: `${width}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="muted-note">Counts show how often each tactic was detected.</p>
        </div>

        <div className="panel tips-panel">
          <PanelTitle icon={Sparkles} title="Safety Tips" />
          {["Never share OTPs or passwords.", "Verify links before clicking.", "Be cautious with urgent messages.", "Use official apps and websites.", "Report suspicious messages."].map((tip) => (
            <div className="tip" key={tip}><CheckCircle2 size={17} /><span>{tip}</span></div>
          ))}
        </div>
      </section>

      <section className="welcome-panel">
        <Shield size={32} /><div><h3>Your conversations deserve protection.</h3><p>Start analyzing messages to identify suspicious behaviour.</p></div>
        <button className="primary-button" onClick={() => setPage("Conversation Simulator")}>Start conversation <ArrowUpRight size={16} /></button>
      </section>
    </>
  );
}
function Stat({ icon: Icon, label, value, color }: any) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon"><Icon size={25} /></div>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

function PanelTitle({ icon: Icon, title }: any) {
  return (
    <div className="panel-title">
      <Icon size={19} />
      <h3>{title}</h3>
    </div>
  );
}

function ChatAssistant() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const prediction = await analyzeMessage(text.trim());
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content">
      <PanelTitle icon={MessageSquare} title="Chat Assistant" />
      <p className="page-description">
        Paste a message and let EarlyShield analyze it for scams and manipulation tactics.
      </p>

      <div className="panel analyzer-panel">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a suspicious message here..."
        />
        <div className="composer-footer">
          <span>{text.length} characters</span>
          <button className="primary-button" disabled={!text.trim() || loading} onClick={handleAnalyze}>
            <Send size={17} /> {loading ? "Analyzing..." : "Analyze Message"}
          </button>
        </div>
      </div>

      {error && <div className="panel analysis-error"><strong>Analysis failed</strong><p>{error}</p><p>Check that the backend is running on port 8000.</p></div>}

      {result && (
        <div className="panel prediction-panel">
          <div className="prediction-heading">
            <h3>EarlyShield Analysis</h3>
            <span className={`risk-badge ${result.risk === "HIGH RISK" ? "risk-high" : result.risk === "SUSPICIOUS" ? "risk-suspicious" : "risk-safe"}`}>{result.risk}</span>
          </div>
          <p className="prediction-confidence">Model confidence: {(result.risk_confidence * 100).toFixed(2)}%</p>
          <h4>Risk probabilities</h4>
          <div className="probability-list">
            {Object.entries(result.risk_probabilities).map(([label, probability]) => (
              <div className="probability-row" key={label}>
                <span>{label}</span><strong>{(probability * 100).toFixed(2)}%</strong>
              </div>
            ))}
          </div>
          <h4>Detected tactics</h4>
          {result.tactics.length ? (
            <div className="tactic-chips">{result.tactics.map((tactic) => <span className="tactic-chip" key={tactic.label}>{tactic.label} · {(tactic.confidence * 100).toFixed(1)}%</span>)}</div>
          ) : <p className="muted-note">No tactics crossed the model's detection threshold.</p>}
          <h4>Message analyzed</h4><p className="analyzed-message">{result.text}</p>
        </div>
      )}
    </div>
  );
}

function ConversationSimulator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sender, setSender] = useState<"scammer" | "victim">("scammer");
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);

  async function sendMessage() {
    const messageText = text.trim();
    if (!messageText || analyzing) return;
    setText("");
    setAnalysisError("");
    if (sender === "victim") {
      setMessages(current => [...current, { sender: "victim", text: messageText }]);
      return;
    }
    setAnalyzing(true);
    try {
      // Build the cumulative transcript so the model sees earlier turns too.
      const transcript = [...messages, { sender: "scammer" as const, text: messageText }]
        .map((turn) => `${turn.sender === "scammer" ? "SCAMMER" : "RECIPIENT"}: ${turn.text}`)
        .join(" </s> ");
      const prediction = await analyzeMessage(transcript);
      setMessages(current => [...current, { sender: "scammer", text: messageText, prediction }]);
      setLatestPrediction(prediction);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Could not analyze this message.");
      setMessages(current => [...current, { sender: "scammer", text: messageText }]);
    } finally {
      setAnalyzing(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setLatestPrediction(null);
    setAnalysisError("");
    setText("");
    setSender("scammer");
  }

  return (
    <div className="simulator-page">
      <div className="simulator-heading"><div>
        <h3><Activity size={20}/> Conversation Simulator</h3>
        <p>Simulate a multi-turn conversation. Each scammer turn is analyzed and saved to History.</p>
      </div><button className="ghost-button" onClick={clearChat} disabled={analyzing}><Trash2 size={16}/> Clear</button></div>

      <div className="conversation-layout">
        <section className="panel chat-panel">
          <div className="chat-header"><div className="avatar scammer-avatar"><ShieldAlert/></div><div><strong>Scammer</strong><p>Potential malicious sender</p></div><span className="role-tag red-tag">SENDER</span></div>
          <div className="chat-messages">
            {messages.filter(m=>m.sender==="victim").map((m,i)=><div className="recipient-message-block" key={i}>
              <small className="simulator-turn-label">Recipient reply · {i + 1}</small>
              <div className="chat-bubble victim-bubble">{m.text}</div>
            </div>)}
            {!messages.some(m=>m.sender==="victim")&&<p className="empty-chat">Recipient replies will appear here from the recipient's side.</p>}
          </div>
        </section>
        <section className="panel chat-panel">
          <div className="chat-header"><div className="avatar victim-avatar"><ShieldCheck/></div><div><strong>Elderly Recipient</strong><p>Potential scam victim · Protected by EarlyShield</p></div><span className="role-tag green-tag">RECIPIENT</span></div>
          <div className="chat-messages">
            {messages.filter(m=>m.sender==="scammer").map((m,i)=><div className="simulator-message-block" key={i}>
              <small className="simulator-turn-label">Scammer message · Turn {i + 1}</small>
              <div className="chat-bubble scammer-bubble">{m.text}</div>
              {m.prediction&&<div className={`simulator-risk-card ${riskClass(m.prediction.risk)}`}>
                <div className="simulator-risk-heading"><strong>{m.prediction.risk}</strong><span>{(m.prediction.risk_confidence*100).toFixed(2)}% confidence</span></div>
                {m.prediction.tactics.length>0&&<div className="tactic-chips">{m.prediction.tactics.map(t=><span className="tactic-chip" key={t.label}>{t.label.replaceAll("_"," ")} · {(t.confidence*100).toFixed(1)}%</span>)}</div>}
                <p className="recipient-safety-note"><strong>EarlyShield warning:</strong> {m.prediction.risk==="HIGH RISK"?"Do not reply, share OTPs, passwords, or send money.":m.prediction.risk==="SUSPICIOUS"?"Be cautious. Verify the sender independently before responding.":"No clear scam indicators detected, but stay alert and never share sensitive information."}</p>
              </div>}
              {!m.prediction&&<p className="muted-note">This message could not be analyzed.</p>}
            </div>)}
            {!messages.some(m=>m.sender==="scammer")&&<p className="empty-chat">Scammer messages and EarlyShield warnings will appear here.</p>}
          </div>
        </section>
      </div>
      {analysisError&&<div className="panel analysis-error"><strong>Message analysis failed</strong><p>{analysisError}</p></div>}
      {latestPrediction&&<div className={`panel simulator-summary ${riskClass(latestPrediction.risk)}`}>
        {(() => {
          const analyzed = messages.filter(m => m.sender === "scammer" && m.prediction);
          const rank: Record<Risk, number> = { "SAFE": 0, "SUSPICIOUS": 1, "HIGH RISK": 2 };
          const overallRisk = analyzed.reduce<Risk>((highest, m) =>
            rank[m.prediction!.risk] > rank[highest] ? m.prediction!.risk : highest, "SAFE");
          const highWaterConfidence = analyzed
            .filter(m => m.prediction!.risk === overallRisk)
            .reduce((max, m) => Math.max(max, m.prediction!.risk_confidence), 0);
          return <>
            <div className="prediction-heading"><h3><ShieldAlert size={20}/> Overall Conversation Risk</h3><span className={`risk-badge ${riskClass(overallRisk)}`}>{overallRisk}</span></div>
            <p className="prediction-confidence">Highest risk observed: {overallRisk} · {(highWaterConfidence*100).toFixed(2)}% confidence</p>
            <div className="prediction-heading"><h4>Latest turn analysis</h4><span className={`risk-badge ${riskClass(latestPrediction.risk)}`}>{latestPrediction.risk}</span></div>
            <p className="prediction-confidence">Latest turn confidence: {(latestPrediction.risk_confidence*100).toFixed(2)}%</p><h4>Detected tactics</h4>
            {latestPrediction.tactics.length?<div className="tactic-chips">{latestPrediction.tactics.map(t=><span className="tactic-chip" key={t.label}>{t.label.replaceAll("_"," ")} · {(t.confidence*100).toFixed(1)}%</span>)}</div>:<p className="muted-note">No tactics crossed the model's detection threshold.</p>}
            <p className="muted-note">Overall risk is the highest predicted level across analyzed scammer turns. Each turn is analyzed with the conversation context available at that point.</p>
          </>;
        })()}
      </div>}
      <div className="panel composer">
        <div className="role-selector">
          <button className={sender==="scammer"?"selected-red":""} onClick={()=>setSender("scammer")}><ShieldAlert size={16}/> Scammer</button>
          <button className={sender==="victim"?"selected-green":""} onClick={()=>setSender("victim")}><ShieldCheck size={16}/> Elderly recipient</button>
        </div>
        <div className="composer-input"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!analyzing&&sendMessage()} placeholder={`Type a message as ${sender==="scammer"?"scammer":"elderly recipient"}...`}/>
          <button className="primary-button" onClick={sendMessage} disabled={!text.trim()||analyzing}><Send size={17}/>{analyzing?"Analyzing...":"Send"}</button></div>
      </div>
    </div>
  );
}

function ModelInfo() {
  return (
    <div className="page-content">
      <PanelTitle icon={Cpu} title="Model Information"/>
      <div className="panel info-grid">
        <InfoRow label="Architecture" value="XLM-RoBERTa Base"/>
        <InfoRow label="Risk classes" value="SAFE · SUSPICIOUS · HIGH RISK"/>
        <InfoRow label="Manipulation tactics" value="8 multi-label outputs"/>
        <InfoRow label="Language" value="English + Tanglish"/>
        <InfoRow label="Checkpoint" value="xlmr_unified_tanglish_best.pth"/>
        <InfoRow label="Reported holdout accuracy" value="84.93%"/>
        <InfoRow label="Inference device" value="CPU / GPU"/>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: any) {
  return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>;
}

function SafetyTips() {
  return (
    <div className="page-content">
      <PanelTitle icon={ShieldAlert} title="Safety Tips"/>
      <div className="tips-grid">
        {[
          ["Protect your OTP", "Never share OTPs, PINs or passwords with anyone."],
          ["Verify the sender", "Contact organisations through official channels."],
          ["Avoid urgent pressure", "Scammers often create fear and urgency."],
          ["Check links", "Never click suspicious or unfamiliar links."],
          ["Avoid upfront fees", "Be cautious of jobs or prizes requiring payment."],
          ["Report suspicious messages", "Contact your bank and appropriate authorities."],
        ].map(([title, text]) => (
          <div className="panel tip-card" key={title}>
            <ShieldCheck size={23}/>
            <h3>{title}</h3><p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  async function loadHistory() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/history");
      if (!response.ok) throw new Error("Could not fetch analysis history.");
      const data: HistoryItem[] = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "History loading failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHistory(); }, []);

  async function deleteItem(id: number) {
    if (!window.confirm("Delete this analysis from history?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/history/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this record.");
      setItems((current) => current.filter((item) => item.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="page-content">
      <div className="history-heading">
        <PanelTitle icon={History} title="Analysis History" />
        <button className="ghost-button" onClick={loadHistory} disabled={loading}>Refresh</button>
      </div>

      {error && <div className="panel analysis-error"><strong>History error</strong><p>{error}</p></div>}
      {loading ? (
        <div className="panel empty-state"><p>Loading history…</p></div>
      ) : items.length === 0 ? (
        <div className="panel empty-state"><History size={36}/><h3>No analysis history yet</h3><p>Analyzed messages will appear here.</p></div>
      ) : (
        <div className="panel history-list">
          {items.map((item) => (
            <article className="history-item" key={item.id}>
              <div className="history-item-main">
                <div className="history-item-top">
                  <span className={`risk-badge ${item.risk === "HIGH RISK" ? "risk-high" : item.risk === "SUSPICIOUS" ? "risk-suspicious" : "risk-safe"}`}>{item.risk}</span>
                  <small>{new Date(item.created_at).toLocaleString()}</small>
                </div>
                <p>{item.message}</p>
                <small>Confidence: {(item.risk_confidence * 100).toFixed(2)}%</small>
              </div>
              <div className="history-actions">
                <button className="ghost-button" onClick={() => setSelected(item)}>Details</button>
                <button className="ghost-button danger-button" onClick={() => deleteItem(item.id)}><Trash2 size={15}/> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="history-modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <div className="panel history-detail history-modal" role="dialog" aria-modal="true" aria-label={`Analysis ${selected.id} details`} onClick={(event) => event.stopPropagation()}>
          <div className="prediction-heading">
            <h3>Analysis #{selected.id}</h3>
            <button className="ghost-button" onClick={() => setSelected(null)}>Close</button>
          </div>
          <span className={`risk-badge ${selected.risk === "HIGH RISK" ? "risk-high" : selected.risk === "SUSPICIOUS" ? "risk-suspicious" : "risk-safe"}`}>{selected.risk}</span>
          <p className="prediction-confidence">Confidence: {(selected.risk_confidence * 100).toFixed(2)}%</p>
          <h4>Latest Scammer Message</h4>
          <div className="analyzed-message">{getLatestScammerMessage(selected.message)}</div>
          <h4>Full Conversation Context</h4>
          <div className="analyzed-message conversation-context">{formatConversation(selected.message)}</div>
          <h4>Risk probabilities</h4>
          {selected.risk_probabilities && Object.keys(selected.risk_probabilities).length ? (
            <div className="probability-list">{Object.entries(selected.risk_probabilities).map(([label, probability]) => (
              <div className="probability-row" key={label}><span>{label}</span><strong>{(probability * 100).toFixed(2)}%</strong></div>
            ))}</div>
          ) : <p className="muted-note">Risk probability breakdown is not available for this record.</p>}
          <h4>Detected Tactics</h4>
          {selected.tactics?.length ? <div className="tactic-chips">{selected.tactics.map(t => <span className="tactic-chip" key={t.label}>{t.label.replaceAll("_", " ")} · {(t.confidence * 100).toFixed(1)}%</span>)}</div> : <p className="muted-note">No tactics available for this record.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function About() {
  return (
    <div className="page-content">
      <PanelTitle icon={Info} title="About EarlyShield"/>
      <div className="panel about-panel">
        <ShieldCheck size={55}/>
        <h2>Early<span>Shield</span></h2>
        <p>Detect · Analyze · Stay Safe</p>
        <p>EarlyShield is an AI-powered scam detection prototype designed to identify scam risk and manipulation tactics in messages and conversations.</p>
      </div>
    </div>
  );
}

export default App;