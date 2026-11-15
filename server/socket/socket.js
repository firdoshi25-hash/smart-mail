import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default function initializeSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !process.env.JWT_SECRET) {
      return next(new Error("Authentication required."));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (typeof decoded !== "object" || typeof decoded.id !== "string" || !mongoose.isValidObjectId(decoded.id)) {
        return next(new Error("Invalid authentication token."));
      }
      socket.data.userId = decoded.id;
      return next();
    } catch {
      return next(new Error("Invalid or expired authentication token."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });
}
