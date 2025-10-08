import express from "express";
import authMiddleware from "../middleware/authMiddlewares.js";
import {
  addSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.use(authMiddleware)

router.post("/", addSchedule);
router.get("/", getSchedules);
router.get("/:id", getSchedule);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;

