// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Auth from '../Models/AuthModel.js';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

const authenticateUser = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await Auth.findById(decoded?.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.userId = user?._id;
    req.name = user?.name;
    req.email = user?.email;

    next();
  } catch (err) {
    console.log("JWT Error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authenticateUser;
