import express from "express";
import authMiddleware from "../middleware/authMiddlewares.js";
import {
  calendarCallback,
  connectCalendar,
  disconnect,
  manualSync,
  status,
  updateAutoSync,
} from "../controllers/calendarController.js";

const router = express.Router();

router.get("/callback", calendarCallback);

router.use(authMiddleware);
router.get("/connect", connectCalendar);
router.get("/status", status);
router.post("/disconnect", disconnect);
router.patch("/auto-sync", updateAutoSync);
router.post("/sync", manualSync);

export default router;
