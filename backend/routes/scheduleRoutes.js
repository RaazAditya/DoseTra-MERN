import { Router } from "express";
const router = Router();
import { createSchedule, getSchedules, getScheduleById, updateSchedule, deleteSchedule } from "../controllers/scheduleController";
import auth from "../middleware/auth"; 

router.use(auth);

router.post("/", createSchedule);
router.get("/", getSchedules);
router.get("/:id", getScheduleById);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;
