import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    // 🔒 Restrict WebSocket origin same as REST — never wildcard
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    },
  });

  // 🔒 Authenticate every socket connection via the same JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      // Attach userId to socket for use in handlers
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-note", (noteId: string) => {
      socket.join(`note-${noteId}`);
    });

    socket.on("leave-note", (noteId: string) => {
      socket.leave(`note-${noteId}`);
    });

    // 🔒 Content from socket is untrusted — REST PATCH is the source of truth.
    //    This just broadcasts; the actual DB write is done via the authenticated HTTP endpoint.
    socket.on("note-change", ({ noteId, content }: { noteId: number; content: string }) => {
      socket.to(`note-${noteId}`).emit("note-update", { noteId, content });
    });
  });

  return io;
};