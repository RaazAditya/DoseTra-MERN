import express from "express";
import authMiddleware from "../middleware/authMiddlewares.js";
import { chat } from "../controllers/chatbotController.js";

const router = express.Router();

router.post("/", authMiddleware, chat);

export default router;
