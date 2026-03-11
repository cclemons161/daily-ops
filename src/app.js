import { useState, useEffect } from "react";

const SUPABASE_URL = "https://ouiiausrysnumflqqaxp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aWlhdXNyeXNudW1mbHFxYXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTM5ODIsImV4cCI6MjA4ODc4OTk4Mn0.kwbAdrCzo1CH2QnGFsod65fQo8Yo8rvjyhT1fii81yw";

const AREAS = ["Kintsugi Rentals", "Redclay Studios", "Household / Family"];
const PRIORITIES = ["high", "med", "low"];

const AREA_CONFIG = {
  "Kintsugi Rentals":   { accent: "#FFB340", icon: "🚗", short: "Kintsugi Rentals" },
  "Redclay Studios":    { accent: "#FF6B6B", icon: "📷", short: "Redclay Studios" },
  "Household / Family": { accent: "#30D158", icon: "🏠", short: "Household" },
};

const PRIORITY_CONFIG = {
  high: { label: "High",   dot: "#FF453A" },
  med:  { label: "Medium", dot: "#FFD60A" },
  low:  { label: "Low",    dot: "#30D158" },
};

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [activeArea, setActiveArea] = useState(AREAS[0]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("high");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sbFetch("tasks?select=*&order=created_at.asc")
      .then(data => setTasks(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function addTask() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const [newTask] = await sbFetch("tasks", {
      method: "POST",
      body: JSON.stringify({ area: activeArea, text, priority, done: false }),
    });
    setTasks(t => [...t, newTask]);
  }

  async function toggleDone(id, current) {
    await sbFetch(`tasks?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ done: !current }),
    });
    setTasks(t => t.map(tk => tk.id === id ? { ...tk, done: !current } : tk));
  }

  async function deleteTask(id) {
    await sbFetch(`tasks?id=eq.${id}`, { method: "DELETE" });
    setTasks(t => t.filter(tk => tk.id !== id));
  }

  async function clearDone() {
    const doneIds = areaTasks.filter(t => t.done).map(t => t.id);
    await sbFetch(`tasks?id=in.(${doneIds.join(",")})`, { method: "DELETE" });
    setTasks(t => t.filter(tk => !doneIds.includes(tk.id)));
  }

  const areaTasks = tasks.filter(t => t.area === activeArea);
  const filtered = areaTasks.filter(tk =>
    filter === "all" ? true : filter === "done" ? tk.done : !tk.done
  );
  const sorted = [...filtered].sort((a, b) =>
    a.done !== b.done ? (a.done ? 1 : -1) : PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)
  );

  const cfg = AREA_CONFIG[activeArea];
  const doneCt = areaTasks.filter(t => t.done).length;
  const openCt = areaTasks.length - doneCt;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1C1C1E",
      color: "#F2F2F7",
      fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      padding: "0 0 60px",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; font-family: inherit; }
        input { font-family: inherit; }
        .tab-pill { transition: background 0.2s, color 0.2s; }
        .task-card { transition: opacity 0.2s; }
        .task-card:hover .del { opacity: 1 !important; }
        .check-circle:active { transform: scale(0.92); }
        .add-btn:active { transform: scale(0.97); }
        ::placeholder { color: #48484A; }
        input:focus { outline: none; }
      `}</style>

      {/* Top bar */}
      <div style={{
        padding: "56px 24px 0",
        background: "linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#98989D", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
          Daily Ops
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 24, color: "#F2F2F7" }}>
          {cfg.icon} {activeArea}
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none" }}>
          {AREAS.map(area => {
            const c = AREA_CONFIG[area];
            const isActive = area === activeArea;
            return (
              <button key={area} className="tab-pill"
                onClick={() => { setActiveArea(area); setFilter("all"); }}
                style={{
                  padding: "7px 16px",
                  background: isActive ? c.accent : "#2C2C2E",
                  color: isActive ? "#000" : "#98989D",
                  fontSize: 13, fontWeight: 600,
                  border: "none", borderRadius: 20, whiteSpace: "nowrap",
                }}>
                {c.icon} {c.short}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Open", value: openCt, color: cfg.accent },
            { label: "Done", value: doneCt, color: "#48484A" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "#2C2C2E", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#98989D", marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
          {doneCt > 0 && (
            <button onClick={clearDone} style={{
              background: "#2C2C2E", border: "none", borderRadius: 14,
              color: "#FF453A", fontSize: 12, fontWeight: 600,
              padding: "14px 16px", whiteSpace: "nowrap",
            }}>Clear Done</button>
          )}
        </div>

        {/* Add task */}
        <div style={{ background: "#2C2C2E", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addTask(); }}
            placeholder="New task..."
            style={{ background: "transparent", border: "none", color: "#F2F2F7", fontSize: 16, width: "100%", marginBottom: 12 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {PRIORITIES.map(p => {
                const pc = PRIORITY_CONFIG[p];
                const isSelected = priority === p;
                return (
                  <button key={p} onClick={() => setPriority(p)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px",
                    background: isSelected ? "#3A3A3C" : "transparent",
                    border: `1px solid ${isSelected ? "#48484A" : "transparent"}`,
                    borderRadius: 20,
                    color: isSelected ? "#F2F2F7" : "#98989D",
                    fontSize: 12, fontWeight: 500,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: pc.dot, display: "inline-block" }} />
                    {pc.label}
                  </button>
                );
              })}
            </div>
            <button className="add-btn" onClick={addTask} style={{
              background: cfg.accent, color: "#000", border: "none",
              borderRadius: 20, padding: "7px 18px", fontSize: 14, fontWeight: 600,
            }}>Add</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["all", "active", "done"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? "#3A3A3C" : "transparent",
              border: "none",
              color: filter === f ? "#F2F2F7" : "#98989D",
              fontSize: 13, fontWeight: 500,
              padding: "5px 14px", borderRadius: 20, textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#48484A", fontSize: 15, padding: "48px 0" }}>Loading...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.length === 0 && (
              <div style={{ textAlign: "center", color: "#48484A", fontSize: 15, padding: "48px 0", fontWeight: 500 }}>
                No tasks here
              </div>
            )}
            {sorted.map(tk => {
              const pc = PRIORITY_CONFIG[tk.priority];
              return (
                <div key={tk.id} className="task-card" style={{
                  background: "#2C2C2E", borderRadius: 14, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  opacity: tk.done ? 0.5 : 1,
                }}>
                  <div className="check-circle" onClick={() => toggleDone(tk.id, tk.done)} style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: `2px solid ${tk.done ? cfg.accent : "#48484A"}`,
                    background: tk.done ? cfg.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, cursor: "pointer",
                  }}>
                    {tk.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 500,
                      color: tk.done ? "#98989D" : "#F2F2F7",
                      textDecoration: tk.done ? "line-through" : "none",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{tk.text}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: pc.dot, display: "inline-block" }} />
                      <span style={{ fontSize: 12, color: "#98989D", fontWeight: 500 }}>{pc.label}</span>
                    </div>
                  </div>
                  <button className="del" onClick={() => deleteTask(tk.id)} style={{
                    background: "#3A3A3C", border: "none", color: "#98989D",
                    width: 28, height: 28, borderRadius: "50%",
                    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 0.15s", flexShrink: 0,
                  }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
