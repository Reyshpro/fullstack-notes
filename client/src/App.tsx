import React, { useState, useEffect } from "react";

function App() {
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<number | null>(null); 

  const backendUrl = "http://localhost:3000";

  // Signup
  const signup = async () => {
    const res = await fetch(`${backendUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    alert(data.message);
  };


  // Login

  const login = async () => {
    const res = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.userId) {
      setUserId(data.userId);
      fetchNotes(data.userId);
      alert(data.message);
    } else {
      alert(data.message);
    }
  };


  // Fetch notes
  const fetchNotes = async (uid: number) => {
    const res = await fetch(`${backendUrl}/notes?userId=${uid}`);
    const data = await res.json();
    setNotes(data);
  };

  
  // Create note
 
  const createNote = async () => {
    if (!userId) {
      alert("You must be logged in!");
      return;
    }

    await fetch(`${backendUrl}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, userId })
    });

    setTitle("");
    setContent("");
    fetchNotes(userId);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Collaborative Notes</h1>

      {!userId && (
        <>
          <h2>Signup / Login</h2>
          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <br />
          <button onClick={signup}>Signup</button>
          <button onClick={login}>Login</button>
        </>
      )}

      {userId && (
        <>
          <h2>Create Note</h2>
          <input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <br />
          <textarea
            placeholder="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <br />
          <button onClick={createNote}>Create</button>

          <h2>My Notes</h2>
          {notes.map(note => (
            <div key={note.id} style={{ border: "1px solid black", margin: 10, padding: 10 }}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;