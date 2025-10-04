import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, timezone } = req.body;

  if (!name || !email || !password || !timezone) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  const exist = await User.findOne({ email });
  if (exist) return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash: hashed,
    timezone,
  });

  if (!user) return res.status(500).json({ message: "Error creating user" });
  // for generating token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  return res
    .status(201)
    .json({ token, user: { id: user._id, name, email, timezone } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Email id doesn't exist" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  // for generating token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  return res
    .status(200)
    .json({ token, user: { id: user._id, name: user.name, email } });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, timezone, settings } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name && typeof name === "string" && name.trim().length >= 2) {
    user.name = name.trim();
  }
  

  if (settings && typeof settings === "object") {
    user.settings = { ...user.settings, ...settings };
  }

  const updatedUser = await user.save();

  const { passwordHash, ...safeUser } = updatedUser.toObject();

  return res.status(200).json({
    message: "Profile updated successfully",
    user: safeUser,
  });
});

export const deleteProfile = asyncHandler(async (req, res) => {

  const deletedUser = await User.findByIdAndDelete(req.user.id);
  if (!deletedUser) return res.status(404).json({ message: "User not found" });
  return res.status(200).json({ message: "User deleted successfully" });
});
