import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";

import AuthRoutes from './Routes/AuthRoutes.js'

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

app.use(cors());

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use('/api/auth', AuthRoutes);

// Attach socket.io to the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Serve a static client later
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("chat-message", ({ username, text }) => {
    io.emit("chat-message", {
      username,
      text,
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

// const PORT = 5000;

// server.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("DB connection established");
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.error("MongoDB connection error:", error));
