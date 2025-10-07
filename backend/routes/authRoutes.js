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
import { dashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/update", authMiddleware, updateProfile);
router.delete("/delete", authMiddleware, deleteProfile);
router.get("/dashboard", authMiddleware, dashboard)

export default router;
