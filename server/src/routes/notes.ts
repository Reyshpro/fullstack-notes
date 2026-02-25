import express from "express";

const router = express.Router();


let notes: any[] = [];


router.post("/", (req, res) => {
  const { title, content, userId } = req.body;

  
  if (!title || !content || !userId) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  const newNote = {
    id: Date.now(),
    title,
    content,
    userId
  };

  notes.push(newNote);

  res.json({
    message: "Note created successfully",
    note: newNote
  });
});



router.get("/", (req, res) => {
  res.json(notes);
});


router.get("/:id", (req, res) => {
  const noteId = Number(req.params.id);

  const note = notes.find(n => n.id === noteId);

  if (!note) {
    return res.status(404).json({
      message: "Note not found"
    });
  }

  res.json(note);
});


export default router;