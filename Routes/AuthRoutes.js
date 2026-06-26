// Routes/AuthRoutes.js
import express from "express";
import {
  loginUser,
  registerUser,
  getAllUsers,
} from "../Controller/AuthController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// NEW: all registered users (for left sidebar)
router.get("/users", getAllUsers);

export default router;