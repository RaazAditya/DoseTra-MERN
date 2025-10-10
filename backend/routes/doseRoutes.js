import express from "express"; 
import authMiddleware from "../middleware/authMiddlewares.js";
import { getAllDoses, updateMultipleDoses } from "../services/doseService.js"; 

const router = express.Router();

router.use(authMiddleware);

// GET all doses
router.get("/", getAllDoses);

// Multiple dose update route
router.put("/update-multiple", async (req, res) => {
  try {
    const { doses } = req.body;

    if (!Array.isArray(doses) || doses.length === 0) {
      return res.status(400).json({ success: false, message: "No doses provided" });
    }

    const updatedDoses = await updateMultipleDoses(doses);

    res.status(200).json({ success: true, updatedDoses });
  } catch (err) {
    console.error("Error in bulk dose update route:", err);
    res.status(500).json({ success: false, message: "Failed to update doses" });
  }
});


export default router;
