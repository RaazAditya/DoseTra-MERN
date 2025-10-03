import express from "express"
import authMiddleware from "../middleware/authMiddlewares.js";
import { addMedicine, deleteMedicine, getAllMedicine, getMedicineById, updateMedicine } from "../controllers/medicineController.js";

const router = express.Router();

router.use(authMiddleware)

router.post("/", addMedicine);
router.get("/", getAllMedicine)
router.get("/:id", getMedicineById)
router.put("/:id", updateMedicine)
router.delete("/:id", deleteMedicine)

export default router;