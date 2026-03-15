import { Server } from "socket.io";

export let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    socket.on("join-note", (noteId: string) => {
      socket.join(`note-${noteId}`);
    });

    socket.on("leave-note", (noteId: string) => {
      socket.leave(`note-${noteId}`);
    });

    socket.on("note-change", ({ noteId, content }: { noteId: number; content: string }) => {
      socket.to(`note-${noteId}`).emit("note-update", { noteId, content });
    });
  });

  return io;
};