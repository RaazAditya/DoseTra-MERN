import express from "express";
import { sendTestNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/test", sendTestNotification);

export default router;
