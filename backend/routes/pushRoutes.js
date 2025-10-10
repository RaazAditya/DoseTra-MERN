import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddlewares.js";

import { sendPushNotification } from "../utils/webPush.js";


const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Save user subscription
router.post("/subscribe", async (req, res) => {
  const userId = req.user._id;
  const { subscription } = req.body;
  await User.findByIdAndUpdate(userId, { pushSubscription: subscription });
  res.status(201).json({ success: true });
});


// Endpoint to get public VAPID key
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC});
});


export default router;
