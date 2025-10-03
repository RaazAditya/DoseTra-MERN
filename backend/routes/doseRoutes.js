import express from "express";
import {
  markTaken,
  markMissed,
  rescheduleDose,
  getDoseLogs,
} from "../controllers/doseController.js";

const router = express.Router();

router.post("/:id/take", markTaken);
router.post("/:id/miss", markMissed);
router.put("/:id/reschedule", rescheduleDose);
router.get("/logs", getDoseLogs);

export default router;
