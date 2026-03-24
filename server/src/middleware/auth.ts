import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ✅ userId is optional here so AuthRequest is assignable to Request
//    It gets set by authMiddleware before any route handler runs
export interface AuthRequest extends Request {
  userId?: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    res.status(401).json({ message: "Invalid token" });
  }
};