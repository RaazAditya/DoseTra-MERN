import Dose from "../models/Dose.js";
import DoseLog from "../models/DoseLog.js";
// Mark dose as taken
export const markTaken = async (req, res) => {
  try {
    const dose = await Dose.findOneAndUpdate(
      { _id: req.params.id },  // use _id instead of doseId if that's your main field
      { status: "taken" },
      { new: true }
    );

    if (!dose) {
      return res.status(404).json({ message: "Dose not found" });
    }

    res.json({ success: true, dose });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mark dose as missed
export const markMissed = async (req, res) => {
  try {
    const dose = await Dose.findOneAndUpdate(
      { _id: req.params.id },
      { status: "missed" },
      { new: true }
    );

    if (!dose) {
      return res.status(404).json({ message: "Dose not found" });
    }

    res.json({ success: true, dose });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
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
