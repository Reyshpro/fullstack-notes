import { useState, useEffect } from "react";
import "./App.css";

type Toast = { id: number; type: "success" | "error" | "info"; msg: string };

function ToastIcon({ type }: { type: Toast["type"] }) {
  if (type === "success") return <span className="toast-icon">✓</span>;
  if (type === "error")   return <span className="toast-icon">✕</span>;
  return <span className="toast-icon">◆</span>;
}

export default function App() {
  const [notes, setNotes]       = useState<any[]>([]);
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken]       = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [toasts, setToasts]     = useState<Toast[]>([]);

  const backendUrl = "http://localhost:3000";

  const toast = (msg: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };

  useEffect(() => {
    if (token) fetchNotes();
  }, [token]);

  const signup = async () => {
    const res = await fetch(`${backendUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    toast(data.message, res.ok ? "success" : "error");
  };

  const login = async () => {
    const res = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      toast("Welcome back.", "success");
    } else {
      toast(data.message, "error");
    }
  };

  const fetchNotes = async () => {
    if (!token) return;
    const res = await fetch(`${backendUrl}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNotes(data);
  };

  const createNote = async () => {
    if (!token) return toast("You must be logged in!", "error");
    if (!title.trim()) return toast("Give your note a title.", "error");
    await fetch(`${backendUrl}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });
    setTitle("");
    setContent("");
    toast("Note saved.", "success");
    fetchNotes();
  };

  const handleLogout = () => {
    setToken(null);
    setNotes([]);
    setSelected(null);
    toast("Signed out.", "info");
  };

  return (
    <div className="shell">

      <header className="header">
        <div className="logo">
          <div className="logo-mark">N</div>
          <span className="logo-text">Nota</span>
        </div>
        <div className="header-status">
          <div className={`status-dot ${token ? "online" : ""}`} />
          {token ? "authenticated" : "not signed in"}
          {token && (
            <button className="logout-btn" style={{ marginLeft: "1rem" }} onClick={handleLogout}>
              sign out
            </button>
          )}
        </div>
      </header>

      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <ToastIcon type={t.type} />
            {t.msg}
          </div>
        ))}
      </div>

      <main className="main">
        {!token ? (

          <div className="auth-panel">
            <div className="auth-eyebrow">your private writing space</div>
            <h1 className="auth-headline">
              Capture every<br /><em>thought.</em>
            </h1>
            <p className="auth-sub">
              Sign in to access your notes — beautifully organized, always private.
            </p>

            <div className="field">
              <label>Email address</label>
              <input
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()}
              />
            </div>

            <div className="btn-row">
              <button className="btn btn-ghost" onClick={signup}>Create account</button>
              <button className="btn btn-primary" onClick={login}>Sign in →</button>
            </div>

            <div className="divider">or</div>
            <p className="auth-hint">new here? create an account above</p>
          </div>

        ) : (

          <div className="notes-layout">

            <aside className="sidebar">
              <div className="sidebar-header">
                <span className="sidebar-title">My Notes</span>
                <span className="note-count">{notes.length}</span>
              </div>

              {notes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◈</div>
                  No notes yet.<br />Write your first one →
                </div>
              ) : (
                <div className="notes-stack">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      className={`note-item ${selected?.id === note.id ? "active" : ""}`}
                      onClick={() => setSelected(selected?.id === note.id ? null : note)}
                    >
                      <div className="note-item-title">{note.title}</div>
                      <div className="note-item-preview">{note.content || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </aside>

            <div className="editor-panel">
              <div className="panel-label">New note</div>

              <div className="editor-box">
                <input
                  className="editor-title-input"
                  placeholder="Untitled note…"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <textarea
                  className="editor-body-input"
                  placeholder="Start writing…"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
                <div className="editor-footer">
                  <span className="char-count">{content.length} chars</span>
                  <button className="btn btn-primary btn-sm" onClick={createNote}>
                    Save note ↵
                  </button>
                </div>
              </div>
              {selected && (
                <div className="note-view">
                  <div className="note-view-title">{selected.title}</div>
                  <div className="note-view-meta">ID · {selected.id}</div>
                  <div className="note-view-body">
                    {selected.content || <em>No content.</em>}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}