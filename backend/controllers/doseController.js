import Dose from "../models/Dose.js";
import DoseLog from "../models/DoseLog.js";

// Mark dose as taken
export const markTaken = async (req, res) => {
  const dose = await Dose.findOneAndUpdate(
    { doseId: req.params.id },
    { status: "taken" },
    { new: true }
  );
  await DoseLog.create({ doseId: req.params.id, action: "taken" });
  res.json(dose);
};

// Mark dose as missed
export const markMissed = async (req, res) => {
  const dose = await Dose.findOneAndUpdate(
    { doseId: req.params.id },
    { status: "missed" },
    { new: true }
  );
  await DoseLog.create({ doseId: req.params.id, action: "missed" });
  res.json(dose);
};

// Reschedule dose
export const rescheduleDose = async (req, res) => {
  const dose = await Dose.findOneAndUpdate(
    { doseId: req.params.id },
    { scheduledAt: req.body.scheduledAt },
    { new: true }
  );
  await DoseLog.create({ doseId: req.params.id, action: "rescheduled" });
  res.json(dose);
};

// Get dose logs
export const getDoseLogs = async (req, res) => {
  const logs = await DoseLog.find();
  res.json(logs);
};
