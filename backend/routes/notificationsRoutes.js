import express from "express";
import {
  getNotifications,
  markNotificationsSeen,
  createNotification,
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddlewares.js";

const router = express.Router();



// All routes require authentication
router.use(authMiddleware);

// router.post("/test",authMiddleware, sendTestNotification);
// router.post("/subscribe",authMiddleware, subscribeNotification);
router.get("/", getNotifications); // fetch all notifications
router.patch("/mark-seen", markNotificationsSeen); // mark all as seen
router.post("/", createNotification); // create a notification (optional)

export default router;






