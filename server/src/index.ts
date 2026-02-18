import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({ message: "Hello from backend 🚀" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
