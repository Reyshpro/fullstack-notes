import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { initSocket } from "./socket";
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

const app = express();
const httpServer = createServer(app);


app.use(helmet());


app.use(cors({
  origin: process.env.CLIENT_URL ?? "http://localhost:5173",
  credentials: true,
}));


app.use(express.json({ limit: "10kb" }));


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

initSocket(httpServer);

app.use("/auth", authLimiter, authRoutes);
app.use("/notes", notesRoutes);

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});