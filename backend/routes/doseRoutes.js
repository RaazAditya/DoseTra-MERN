import express from "express";
import { getAllDoses } from "../services/doseService.js"; 
import authMiddleware from "../middleware/authMiddlewares.js";

const router = express.Router();

router.use(authMiddleware);
// GET all doses for logged-in user (or for demo, fetch all)
router.get("/", getAllDoses);

export default router;
