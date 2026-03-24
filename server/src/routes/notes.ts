import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { io } from "../socket";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = express.Router();

const createNoteSchema = z.object({
  title:   z.string().min(1).max(200).trim(),
  content: z.string().min(1).max(50_000).trim(),
});

const updateNoteSchema = z.object({
  content: z.string().min(1).max(50_000).trim(),
});

const shareNoteSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase().trim(),
});

const parseId = (raw: string): number | null => {
  const id = parseInt(raw, 10);
  return isNaN(id) || id <= 0 ? null : id;
};

// Helper: cast req to AuthRequest after authMiddleware has run
// This avoids the TypeScript overload conflict on router.post/get/patch
const auth = (
  handler: (req: AuthRequest, res: Response) => Promise<Response | void>
) => {
  return (req: Request, res: Response, _next: NextFunction) => {
    return handler(req as AuthRequest, res);
  };
};

// CREATE NOTE
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId!;  // ← this line must be here

  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    const note = await prisma.note.create({
      data: { ...parsed.data, userId },
    });
    return res.status(201).json({ message: "Note created successfully", note });
  } catch (error) {
    console.error("[create note]", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// GET MY NOTES
router.get("/", authMiddleware, auth(async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.userId },
      include: { sharedWith: true },
    });
    return res.json(notes);
  } catch (error) {
    console.error("[get notes]", error);
    return res.status(500).json({ message: "Server error" });
  }
}));

// GET NOTES SHARED WITH ME
router.get("/shared-with-me", authMiddleware, auth(async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const shared = await prisma.sharedNote.findMany({
      where: { sharedWithEmail: user.email },
      include: {
        note: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    return res.json(shared.map((s) => ({ ...s.note, sharedNoteId: s.id })));
  } catch (error) {
    console.error("[shared-with-me]", error);
    return res.status(500).json({ message: "Server error" });
  }
}));

// SHARE A NOTE
router.post("/:id/share", authMiddleware, auth(async (req, res) => {
  // ✅ Cast to string — Express params are string | string[], we always get string here
  const noteId = parseId(req.params.id as string);
  if (!noteId) return res.status(400).json({ message: "Invalid note ID" });

  const parsed = shareNoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid email" });

  const { email } = parsed.data;

  try {
    const note = await prisma.note.findUnique({ where: { id: noteId } });

    if (!note || note.userId !== req.userId) {
      return res.status(403).json({ message: "Not your note" });
    }

    const me = await prisma.user.findUnique({ where: { id: req.userId } });
    if (me?.email === email) {
      return res.status(400).json({ message: "You cannot share with yourself" });
    }

    const existing = await prisma.sharedNote.findFirst({
      where: { noteId, sharedWithEmail: email },
    });
    if (existing) return res.status(409).json({ message: "Already shared with this email" });

    await prisma.sharedNote.create({ data: { noteId, sharedWithEmail: email } });
    return res.json({ message: `Note shared with ${email}` });
  } catch (error) {
    console.error("[share note]", error);
    return res.status(500).json({ message: "Server error" });
  }
}));

// UPDATE NOTE
router.patch("/:id", authMiddleware, auth(async (req, res) => {
  const noteId = parseId(req.params.id as string);
  if (!noteId) return res.status(400).json({ message: "Invalid note ID" });

  const parsed = updateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    const [note, user] = await Promise.all([
      prisma.note.findUnique({ where: { id: noteId } }),
      prisma.user.findUnique({ where: { id: req.userId } }),
    ]);

    if (!note) return res.status(404).json({ message: "Note not found" });

    const isOwner = note.userId === req.userId;
    const isCollaborator = await prisma.sharedNote.findFirst({
      where: { noteId, sharedWithEmail: user?.email },
    });

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { content: parsed.data.content },
    });

    io.to(`note-${noteId}`).emit("note-update", {
      noteId,
      content: parsed.data.content,
    });

    return res.json(updated);
  } catch (error) {
    console.error("[update note]", error);
    return res.status(500).json({ message: "Server error" });
  }
}));

export default router;