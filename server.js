// server.js
import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";

import AuthRoutes from "./Routes/AuthRoutes.js";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;
const SECRET_KEY = process.env.SECRET_KEY;

// basic middleware
app.use(
  cors({
    origin: "*", // in prod: your Next.js URL
    credentials: true,
  })
);

import path from "node:path";

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

app.get("/test-upload", (req, res) => {
  res.sendFile(path.join(process.cwd(), "uploads", "text.txt"));
});

// app.use("/uploads", express.static("uploads"));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use("/api/auth", AuthRoutes);
app.use(express.static("public"));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // in prod: your Next.js URL
    credentials: true,
  },
});

// ========== SOCKET.IO AUTH MIDDLEWARE ==========
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error: no token"));
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    socket.userId = payload.userId;
    socket.username = payload.name;
    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    next(new Error("Authentication error: invalid token"));
  }
});

// ========== PRESENCE & ROOMS ==========
// userId -> Set(socketId)
const userSockets = new Map();

function emitOnlineUsers() {
  const onlineUserIds = Array.from(userSockets.keys());
  io.emit("online-users", onlineUserIds);
}

function makeRoomId(userAId, userBId) {
  const [a, b] = [String(userAId), String(userBId)].sort();
  return `dm:${a}:${b}`;
}

// ========== SOCKET CONNECTION HANDLER ==========
io.on("connection", (socket) => {
  console.log(
    "Socket connected:",
    socket.id,
    "userId:",
    socket.userId,
    "name:",
    socket.username
  );

  const userId = socket.userId;

  // track sockets per user
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);

  emitOnlineUsers();

  // join 1–1 DM room
  socket.on("join-dm", ({ toUserId }) => {
    if (!toUserId || !userId) return;

    const roomId = makeRoomId(userId, toUserId);

    // this socket joins room
    socket.join(roomId);

    // if other user online, join their sockets too
    const targetSockets = userSockets.get(toUserId);
    if (targetSockets) {
      for (const sid of targetSockets) {
        const s = io.sockets.sockets.get(sid);
        s?.join(roomId);
      }
    }

    // tell this client which room to use
    socket.emit("joined-dm", { roomId, toUserId });
  });

  // DM message (ephemeral)
  socket.on("dm-message", ({ roomId, text }) => {
    if (!roomId || !text) return;

    io.to(roomId).emit("dm-message", {
      roomId,
      fromUserId: socket.userId,
      fromUsername: socket.username,
      text,
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);

    const set = userSockets.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        userSockets.delete(userId);
      }
    }

    emitOnlineUsers();
  });
});

// ========== DB + SERVER START ==========
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("DB connection established");
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.error("MongoDB connection error:", error));