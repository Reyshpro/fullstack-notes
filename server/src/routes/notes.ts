import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const router = express.Router();
const JWT_SECRET = "your_super_secret_key";

// Auth middleware
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
  const userId = req.userId;

  if (!title || !content) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        userId,
      },
    });

    res.json({ message: "Note created successfully", note: newNote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET NOTES
router.get("/", authMiddleware, async (req: any, res: any) => {
  const userId = req.userId;

  try {
    const notes = await prisma.note.findMany({
      where: { userId },
    });

    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;