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
    userId,
    sharedWith: [] 
  };

  notes.push(newNote);

  res.json({
    message: "Note created successfully",
    note: newNote
  });
});

  router.get("/", (req, res) => {
    const userId = Number(req.query.userId);

    if (!userId) {
      return res.status(400).json({
        message: "User ID query param required"
      });
    }

    const accessibleNotes = notes.filter(note =>
      note.userId === userId ||
      note.sharedWith.includes(userId)
    );

    res.json(accessibleNotes);
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

  router.post("/:id/share", (req, res) => {
    const noteId = Number(req.params.id);
    const { userIdToShare } = req.body;

    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    if (!userIdToShare) {
      return res.status(400).json({
        message: "User ID to share is required"
      });
    }

    // Prevent duplicate sharing
    if (note.sharedWith.includes(userIdToShare)) {
      return res.status(400).json({
        message: "Note already shared with this user"
      });
    }

    note.sharedWith.push(userIdToShare);

    res.json({
      message: "Note shared successfully",
      note
    });
  });

export default router;