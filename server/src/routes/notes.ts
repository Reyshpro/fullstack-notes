import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = "your_super_secret_key";

let notes: any[] = [];


const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};


router.post("/", authMiddleware, (req: any, res: any) => {
  const { title, content } = req.body;
  const userId = req.userId;

  if (!title || !content) return res.status(400).json({ message: "All fields required" });

  const newNote = { id: Date.now(), title, content, userId, sharedWith: [] };
  notes.push(newNote);

  res.json({ message: "Note created successfully", note: newNote });
});

router.get("/", authMiddleware, (req: any, res: any) => {
  const userId = req.userId;
  const accessibleNotes = notes.filter(note =>
    note.userId === userId || note.sharedWith.includes(userId)
  );
  res.json(accessibleNotes);
});

export default router;