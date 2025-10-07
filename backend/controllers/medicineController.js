import Medicine from "../models/Medicine.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addMedicine = asyncHandler(async (req, res) => {
  const { name, dosage, form, frequency, instructions } = req.body;
  if (!name || !dosage || !frequency) {
    return res
      .status(400)
      .json({ message: "Name, dosage and frequency are required" });
  }
  const medicine = await Medicine.create({
    userId: req.user.id,
    name,
    frequency,
    dosage,
    form: form || "tablet",
    instructions: instructions || "",
  });

  return res
    .status(201)
    .json({ message: "Medicine added successfully", medicine });
});

export const getAllMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    message: medicine.length
      ? "Fetched all the medicines successfully"
      : "No medicines found for this user",
    data: medicine, // this will be [] if empty
  });
});

export const getMedicineById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const medicine = await Medicine.findOne({ userId: req.user.id, _id: id });
  if (!medicine) {
    return res.status(404).json({ message: "Medicine not found" });
  }
  return res
    .status(200)
    .json(medicine, { message: "Medicine fetched successfully" });
});

export const updateMedicine = asyncHandler(async (req, res) => {
  const { name, dosage, form, frequency, instructions } = req.body;
  const { id } = req.params;

  const medicine = await Medicine.findOne({ _id: id, userId: req.user.id });
  if (!medicine) {
    return res.status(404).json({ message: "Medicine not found" });
  }
  if (name) medicine.name = name;
  if (frequency) medicine.frequency = frequency;
  if (dosage) medicine.dosage = dosage;
  if (form) medicine.form = form;
  if (instructions !== undefined) medicine.instructions = instructions;

  await medicine.save();
  return res
    .status(200)
    .json({ message: "Medicine updated successfully", medicine });
});

export const deleteMedicine = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const medicine = await Medicine.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
    }
    return res.status(200).json({ message: "Medicine deleted successfully" });
});
