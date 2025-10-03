import express from "express";
import {
  deleteProfile,
  getProfile,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddlewares.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/update", authMiddleware, updateProfile);
router.delete("/delete", authMiddleware, deleteProfile);

export default router;
