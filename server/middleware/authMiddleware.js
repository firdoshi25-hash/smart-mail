import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please sign in to continue." });
  }
  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is not configured."));
  }
  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded !== "object" || typeof decoded.id !== "string" || !mongoose.isValidObjectId(decoded.id)) {
      return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
    }
    req.userId = decoded.id;
    return next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
