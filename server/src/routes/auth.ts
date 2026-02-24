import express from "express";
import bcrypt from "bcryptjs";

const router = express.Router();


let users: any[] = [];

// SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now(),
    email,
    password: hashedPassword
  };

  users.push(user);

  res.json({
    message: "User created successfully"
  });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(400).json({
      message: "User not found"
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({
      message: "Invalid password"
    });
  }

  res.json({
    message: "Login successful",
    userId: user.id
  });
});

export default router;