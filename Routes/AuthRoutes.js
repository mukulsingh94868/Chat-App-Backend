// Routes/AuthRoutes.js
import express from "express";
import {
  getAllUsers,
  loginUser,
  registerUser,
  updateProfileImage,
} from "../Controller/AuthController.js";
import authenticateUser from "../middleware/authMiddleware.js";
import { upload } from "../Middleware/upload.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// NEW: all registered users (for left sidebar)
router.get("/users", getAllUsers);

// NEW: update profile image (protected)
router.post(
  "/profile-image",
  authenticateUser,
  upload.single("profileImage"),
  updateProfileImage,
);

export default router;
