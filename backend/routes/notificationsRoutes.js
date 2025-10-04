import express from "express";
import { sendTestNotification, subscribeNotification } from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddlewares.js";

const router = express.Router();

router.post("/test",authMiddleware, sendTestNotification);
router.post("/subscribe",authMiddleware, subscribeNotification);

export default router;

