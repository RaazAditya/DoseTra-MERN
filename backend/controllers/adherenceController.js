import DoseLog from "../models/DoseLog.js";

export const getAdherence = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch all logs for this user
    const logs = await DoseLog.find({ userId });

    if (!logs.length) {
      return res.json({
        riskPeriods: [],
        message: "No dose logs found. Start tracking your doses!",
      });
    }

    // Initialize counters
    const stats = {
      morning: { total: 0, missed: 0 },
      afternoon: { total: 0, missed: 0 },
      evening: { total: 0, missed: 0 },
      night: { total: 0, missed: 0 },
    };

    logs.forEach((log) => {
      const hour = new Date(log.recordedAt).getHours();
      let period = "night";

      if (hour >= 6 && hour < 12) period = "morning";
      else if (hour >= 12 && hour < 18) period = "afternoon";
      else if (hour >= 18 && hour < 22) period = "evening";

      stats[period].total++;
      if (log.action === "missed") stats[period].missed++;
    });

    // Detect risky periods (>40% missed)
    let riskPeriods = [];
    let riskMessages = [];

    for (let p in stats) {
      if (stats[p].total > 0 && stats[p].missed / stats[p].total > 0.4) {
        riskPeriods.push(p);
        riskMessages.push(`${stats[p].missed} of ${stats[p].total} doses missed in the ${p}`);
      }
    }

    // Build the message
    let message;
    if (riskPeriods.length > 0) {
      message = `⚠️ You have risky adherence patterns:\n- ${riskMessages.join("\n- ")}\nConsider enabling smart reminders.`;
    } else {
      message = "Great job! No risky patterns detected 🎉";
    }

    res.json({ riskPeriods, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      riskPeriods: [],
      message: "Unable to fetch adherence data.",
    });
  }
};
