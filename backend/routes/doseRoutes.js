import { Router } from "express";
const router = Router();
import { takeDose, missDose, rescheduleDose, getLogs } from "../controllers/doseController";
import auth from "../middleware/auth";

router.use(auth);

router.post("/:id/take", takeDose);
router.post("/:id/miss", missDose);
router.put("/:id/reschedule", rescheduleDose);
router.get("/logs", getLogs);

export default router;
