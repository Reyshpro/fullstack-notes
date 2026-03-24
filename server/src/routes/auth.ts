import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma";

const router = express.Router();


const JWT_SECRET = process.env.JWT_SECRET!;

const authSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// SIGNUP
router.post("/signup", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });

  }

  const { email, password } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });


    if (existingUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    res.status(201).json({ message: "Account created successfully", userId: user.id });
  } catch (error) {

    console.error("[signup error]", error);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });

  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    const dummyHash = "$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const isMatch = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isMatch) {

      return res.status(401).json({ message: "Invalid credentials" });
    }

const token = jwt.sign(
  { userId: user.id },
  JWT_SECRET,
  { expiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"] }
);

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("[login error]", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;