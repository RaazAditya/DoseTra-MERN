// routes/adherenceRoutes.js
import express from "express";
import { getAdherence } from "../controllers/adherenceController.js";

const router = express.Router();

router.get("/:userId", getAdherence);

export default router;
