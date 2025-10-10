import Dose from "../models/Dose.js";
import DoseLog from "../models/DoseLog.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js"; // your notification helper

// Mark dose as taken
export const markTaken = async (req, res) => {
  try {
    const dose = await Dose.findOneAndUpdate(
      { doseId: req.params.id },
      { status: "taken" },
      { new: true }
    );

    await DoseLog.create({ doseId: req.params.id, action: "taken" });

    res.json(dose);
  } catch (err) {
    console.error("Error marking dose taken:", err);
    res.status(500).json({ message: "Failed to mark dose as taken" });
  }
};

// Mark dose as missed + schedule smart reminder
export const markMissed = async (req, res) => {
  try {
    const dose = await Dose.findOneAndUpdate(
      { doseId: req.params.id },
      { status: "missed" },
      { new: true }
    );

    await DoseLog.create({ doseId: req.params.id, action: "missed" });

    // Smart Reminder
    const user = await User.findById(req.body.userId); // or req.user._id if using auth middleware
    if (user && user.smartReminders) {
      setTimeout(async () => {
        try {
          await createNotification({
            userId: user._id,
            type: "reminder",
            title: "Missed Dose Reminder",
            message: `Don’t forget! You missed your dose (${dose.doseId}). Please take it now.`,
            subscription: user.subscription || null, // optional: for push notifications
          });
        } catch (err) {
          console.error("Failed to send smart reminder:", err);
        }
      }, 15 * 60 * 1000); // 15 minutes
    }

    res.json(dose);
  } catch (err) {
    console.error("Error marking dose missed:", err);
    res.status(500).json({ message: "Failed to mark dose as missed" });
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
  try {
    const dose = await Dose.findOneAndUpdate(
      { doseId: req.params.id },
      { scheduledAt: req.body.scheduledAt },
      { new: true }
    );

    await DoseLog.create({ doseId: req.params.id, action: "rescheduled" });

    res.json(dose);
  } catch (err) {
    console.error("Error rescheduling dose:", err);
    res.status(500).json({ message: "Failed to reschedule dose" });
  }
};

// Get dose logs
export const getDoseLogs = async (req, res) => {
  try {
    const logs = await DoseLog.find();
    res.json(logs);
  } catch (err) {
    console.error("Error fetching dose logs:", err);
    res.status(500).json({ message: "Failed to fetch dose logs" });
  }
};
// Export the controller functions