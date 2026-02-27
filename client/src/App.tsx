import React, { useState, useEffect } from "react";

function App() {
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const userId = 1; // temporary hardcoded user

// Fetch notes
const fetchNotes = async () => {
  const res = await fetch(`http://localhost:3000/notes?userId=${userId}`);
  const data = await res.json();
  setNotes(data);
};

// Create note
const createNote = async () => {
  await fetch("http://localhost:3000/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, userId })
  });

  setTitle("");
  setContent("");
  fetchNotes();
};

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Collaborative Notes</h1>

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
    </div>
  );
}

export default App;