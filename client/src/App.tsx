import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";

type Toast = { id: number; type: "success" | "error" | "info"; msg: string };
type Note  = { id: number; title: string; content: string; sharedWith?: any[] };

function ToastIcon({ type }: { type: Toast["type"] }) {
  if (type === "success") return <span className="toast-icon">✓</span>;
  if (type === "error")   return <span className="toast-icon">✕</span>;
  return <span className="toast-icon">◆</span>;
}

const BACKEND = "http://localhost:3000";

export default function App() {
  const [notes, setNotes]               = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes]   = useState<Note[]>([]);
  const [title, setTitle]               = useState("");
  const [content, setContent]           = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [token, setToken]               = useState<string | null>(null);
  const [selected, setSelected]         = useState<Note | null>(null);
  const [editContent, setEditContent]   = useState("");
  const [shareEmail, setShareEmail]     = useState("");
  const [showShareFor, setShowShareFor] = useState<number | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [activeTab, setActiveTab]       = useState<"mine" | "shared">("mine");
  const socketRef                       = useRef<Socket | null>(null);
  const isRemoteUpdate                  = useRef(false);

  const toast = (msg: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };

 
  useEffect(() => {
    socketRef.current = io(BACKEND);

    socketRef.current.on("note-update", ({ noteId, content: incoming }) => {
      if (selected?.id === noteId) {
        isRemoteUpdate.current = true;
        setEditContent(incoming);
      }
      
      setNotes(n => n.map(x => x.id === noteId ? { ...x, content: incoming } : x));
      setSharedNotes(n => n.map(x => x.id === noteId ? { ...x, content: incoming } : x));
    });

    return () => { socketRef.current?.disconnect(); };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    socketRef.current?.emit("join-note", selected.id);
    setEditContent(selected.content);
    return () => { socketRef.current?.emit("leave-note", selected.id); };
  }, [selected?.id]);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    const res  = await fetch(`${BACKEND}/notes`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setNotes(data);
  }, [token]);

  const fetchSharedNotes = useCallback(async () => {
    if (!token) return;
    const res  = await fetch(`${BACKEND}/notes/shared-with-me`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setSharedNotes(data);
  }, [token]);

  useEffect(() => {
    if (token) { fetchNotes(); fetchSharedNotes(); }
  }, [token, fetchNotes, fetchSharedNotes]);

  // ── Auth 
  const signup = async () => {
    const res  = await fetch(`${BACKEND}/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    toast(data.message, res.ok ? "success" : "error");
  };

  const login = async () => {
    const res  = await fetch(`${BACKEND}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (data.token) { setToken(data.token); toast("Welcome back.", "success"); }
    else toast(data.message, "error");
  };

  const handleLogout = () => {
    setToken(null); setNotes([]); setSharedNotes([]); setSelected(null);
    toast("Signed out.", "info");
  };

  // ── Notes CRUD 
  const createNote = async () => {
    if (!token) return toast("You must be logged in!", "error");
    if (!title.trim()) return toast("Give your note a title.", "error");
    await fetch(`${BACKEND}/notes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, content }) });
    setTitle(""); setContent("");
    toast("Note saved.", "success");
    fetchNotes();
  };

  // Live edit 
  const handleEditChange = (val: string) => {
    setEditContent(val);
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
    if (!selected) return;
    socketRef.current?.emit("note-change", { noteId: selected.id, content: val });
    debouncedSave(selected.id, val);
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = (noteId: number, val: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch(`${BACKEND}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: val }),
      });
    }, 800);
  };


  const shareNote = async (noteId: number) => {
    if (!shareEmail.trim()) return toast("Enter an email to share with.", "error");
    const res  = await fetch(`${BACKEND}/notes/${noteId}/share`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: shareEmail }) });
    const data = await res.json();
    toast(data.message, res.ok ? "success" : "error");
    if (res.ok) { setShareEmail(""); setShowShareFor(null); fetchNotes(); }
  };

  
  const visibleNotes = activeTab === "mine" ? notes : sharedNotes;

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
          {token && <button className="logout-btn" style={{ marginLeft: "1rem" }} onClick={handleLogout}>sign out</button>}
        </div>
      </header>

      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <ToastIcon type={t.type} />{t.msg}
          </div>
        ))}
      </div>

      <main className="main">
        {!token ? (

          <div className="auth-panel">
            <div className="auth-eyebrow">your private writing space</div>
            <h1 className="auth-headline">Capture every<br /><em>thought.</em></h1>
            <p className="auth-sub">Sign in to access your notes — beautifully organized, always private.</p>
            <div className="field">
              <label>Email address</label>
              <input placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
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
                <span className="sidebar-title">Notes</span>
                <span className="note-count">{visibleNotes.length}</span>
              </div>

              {/* Tab switcher */}
              <div className="tab-row">
                <button className={`tab-btn ${activeTab === "mine" ? "active" : ""}`} onClick={() => setActiveTab("mine")}>Mine</button>
                <button className={`tab-btn ${activeTab === "shared" ? "active" : ""}`} onClick={() => setActiveTab("shared")}>
                  Shared with me {sharedNotes.length > 0 && <span className="badge">{sharedNotes.length}</span>}
                </button>
              </div>

              {visibleNotes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◈</div>
                  {activeTab === "mine" ? <>No notes yet.<br />Write your first one →</> : "No one has shared a note with you yet."}
                </div>
              ) : (
                <div className="notes-stack">
                  {visibleNotes.map(note => (
                    <div key={note.id} className={`note-item ${selected?.id === note.id ? "active" : ""}`} onClick={() => setSelected(selected?.id === note.id ? null : note)}>
                      <div className="note-item-title">{note.title}</div>
                      <div className="note-item-preview">{note.content || "—"}</div>
                   
                      {activeTab === "mine" && (
                        <button className="share-btn" onClick={e => { e.stopPropagation(); setShowShareFor(showShareFor === note.id ? null : note.id); setShareEmail(""); }}>
                          ⤴ Share
                        </button>
                      )}
                   
                      {showShareFor === note.id && (
                        <div className="share-form" onClick={e => e.stopPropagation()}>
                          <input placeholder="colleague@example.com" value={shareEmail} onChange={e => setShareEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && shareNote(note.id)} />
                          <button className="btn btn-primary btn-sm" onClick={() => shareNote(note.id)}>Send</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </aside>

            <div className="editor-panel">
            
              {selected ? (
                <div className="note-view">
                  <div className="note-view-header">
                    <div className="note-view-title">{selected.title}</div>
                    <div className="note-view-meta collab-badge">● live editing</div>
                  </div>
                  <textarea
                    className="editor-body-input collab-editor"
                    value={editContent}
                    onChange={e => handleEditChange(e.target.value)}
                  />
                  <div className="editor-footer">
                    <span className="char-count">{editContent.length} chars</span>
                    <span className="save-hint">auto-saves as you type</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="panel-label">New note</div>
                  <div className="editor-box">
                    <input className="editor-title-input" placeholder="Untitled note…" value={title} onChange={e => setTitle(e.target.value)} />
                    <textarea className="editor-body-input" placeholder="Start writing…" value={content} onChange={e => setContent(e.target.value)} />
                    <div className="editor-footer">
                      <span className="char-count">{content.length} chars</span>
                      <button className="btn btn-primary btn-sm" onClick={createNote}>Save note ↵</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}