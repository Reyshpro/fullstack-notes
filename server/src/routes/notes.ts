import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { io } from "../socket";

const router = express.Router();
const JWT_SECRET = "your_super_secret_key";

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

// CREATE NOTE
router.post("/", authMiddleware, async (req: any, res: any) => {
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ message: "All fields required" });
  try {
    const note = await prisma.note.create({
      data: { title, content, userId: req.userId },
    });
    res.json({ message: "Note created successfully", note });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET MY NOTES
router.get("/", authMiddleware, async (req: any, res: any) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.userId },
      include: { sharedWith: true },
    });
    res.json(notes);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// GET NOTES SHARED WITH ME
router.get("/shared-with-me", authMiddleware, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const shared = await prisma.sharedNote.findMany({
      where: { sharedWithEmail: user.email },
      include: { note: { include: { user: true } } },
    });

    res.json(shared.map((s) => ({ ...s.note, sharedNoteId: s.id })));
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// SHARE A NOTE
router.post("/:id/share", authMiddleware, async (req: any, res: any) => {
  const noteId = parseInt(req.params.id);
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
  
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.userId !== req.userId)
      return res.status(403).json({ message: "Not your note" });

    const me = await prisma.user.findUnique({ where: { id: req.userId } });
    if (me?.email === email)
      return res.status(400).json({ message: "You cannot share with yourself" });

    const existing = await prisma.sharedNote.findFirst({
      where: { noteId, sharedWithEmail: email },
    });
    if (existing)
      return res.status(400).json({ message: "Already shared with this email" });

    await prisma.sharedNote.create({ data: { noteId, sharedWithEmail: email } });
    res.json({ message: `Note shared with ${email}` });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", authMiddleware, async (req: any, res: any) => {
  const noteId = parseInt(req.params.id);
  const { content } = req.body;

  try {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return res.status(404).json({ message: "Note not found" });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const isOwner = note.userId === req.userId;
    const isCollaborator = await prisma.sharedNote.findFirst({
      where: { noteId, sharedWithEmail: user?.email },
    });

    if (!isOwner && !isCollaborator)
      return res.status(403).json({ message: "Access denied" });

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { content },
    });

    io.to(`note-${noteId}`).emit("note-update", { noteId, content });

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;