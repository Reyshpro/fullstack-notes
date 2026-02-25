import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/notes", notesRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
