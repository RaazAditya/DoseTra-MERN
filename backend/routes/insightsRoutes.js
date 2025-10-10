import express from "express";
import DoseLog from "../models/DoseLog.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch last 7 days logs
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const logs = await DoseLog.find({
      user: userId,
      timestamp: { $gte: lastWeek }
    });

    const taken = logs.filter(l => l.status === "taken").length;
    const missed = logs.filter(l => l.status === "missed").length;

    let message = "Great job! 🎉";
    if (missed > taken / 2) {
      message = " You’re missing many doses. Consider enabling smart reminders.";
    } else if (missed > 0) {
      message = "You’ve missed a few doses. Stay consistent!";
    }

    res.json({ insight: message, taken, missed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
