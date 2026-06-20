import express from "express";
import authMiddleware from "../middleware/authMiddlewares.js";
import { getPredict, getAdherenceInsight } from "../controllers/aiController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/predict", getPredict);
router.get("/adherence-insight", getAdherenceInsight);

export default router;
