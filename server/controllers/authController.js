import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

export async function registerUser(req, res, next) {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (name.length > 80 || !emailPattern.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Please provide a valid name and email address." });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    const existing = await User.findOne({ email }).select("_id");
    if (existing) return res.status(409).json({ message: "An account with that email already exists." });

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    return res.status(201).json({ message: "Account created successfully.", user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with that email already exists." });
    return next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ message: "Login successful.", token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("name email createdAt");
    if (!user) return res.status(401).json({ message: "Your account is no longer available. Please sign in again." });
    return res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}
