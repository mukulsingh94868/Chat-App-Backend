import express from "express";
import {
  getAllUsers,
  loginUser,
  registerUser,
} from "../Controller/AuthController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", getAllUsers);

export default router;
