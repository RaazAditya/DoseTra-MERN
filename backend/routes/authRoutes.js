import express from "express";
import {
  deleteProfile,
  getProfile,
  googleLogin,
  login,
  logout,
  register,
  resendOtp,
  updateProfile,
  verifyOtp,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddlewares.js";
import { dashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/update", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteProfile);
router.get("/dashboard", authMiddleware, dashboard);

export default router;
