import express from "express";
import {
  createSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/", createSchedule);
router.get("/", getSchedules);
router.get("/:id", getSchedule);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;

