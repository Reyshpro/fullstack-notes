import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initSocket } from "./socket";   
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);  

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/notes", notesRoutes);

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});