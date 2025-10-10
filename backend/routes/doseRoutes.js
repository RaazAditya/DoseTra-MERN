import express from "express";
import { markTaken, markMissed, rescheduleDose, getDoseLogs } from "../controllers/doseController.js"; 
import authMiddleware from "../middleware/authMiddlewares.js";
import { getAllDoses } from "../services/doseService.js"; 

const router = express.Router();

router.use(authMiddleware);

// GET all doses
router.get("/", getAllDoses);

// Mark dose as taken
router.put("/:id/mark-taken", markTaken);

// Mark dose as missed
router.put("/:id/mark-missed", markMissed);

// Reschedule a dose
router.put("/:id/reschedule", rescheduleDose);

// Get dose logs
router.get("/logs", getDoseLogs);

export default router;
