import express from "express";
import DoseLog from "../models/DoseLog.js";

const router = express.Router();

/**
 * Analyze adherence patterns for a user
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch all logs for this user
    const logs = await DoseLog.find({ userId });

    // Stats counters
    let stats = {
      morning: { total: 0, missed: 0 },
      afternoon: { total: 0, missed: 0 },
      night: { total: 0, missed: 0 }
    };

    logs.forEach(log => {
      const hour = new Date(log.recordedAt).getHours();
      let period = "night";

      if (hour >= 6 && hour < 12) period = "morning";
      else if (hour >= 12 && hour < 18) period = "afternoon";

      stats[period].total++;
      if (log.action === "missed") {
        stats[period].missed++;
      }
    });

    // Detect risk periods
    let riskPeriods = [];
    for (let p in stats) {
      if (stats[p].total > 0 && stats[p].missed / stats[p].total > 0.4) {
        riskPeriods.push(p);
      }
    }

    res.json({ stats, riskPeriods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
// Export the router