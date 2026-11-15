import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";
import initializeSocket from "./socket/socket.js";

const app = express();
const httpServer = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

initializeSocket(io);
app.set("io", io);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("This origin is not allowed by the server."));
  },
}));
app.use(express.json({ limit: "25kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/mail", mailRoutes);
app.get("/", (_req, res) => res.json({ message: "Smart Mail API is running." }));
app.use((error, _req, res, _next) => {
  console.error("Unhandled request error:", error.message);
  res.status(error.status || 500).json({
    message: error.status ? error.message : "The server could not complete your request.",
  });
});

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
  }
  await connectDB();
  const port = Number(process.env.PORT) || 9000;
  httpServer.listen(port, () => {
    console.log(`Smart Mail API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Smart Mail failed to start:", error.message);
  process.exitCode = 1;
});
