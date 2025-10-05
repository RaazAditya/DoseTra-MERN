import Dose from "../models/Dose.js";
import DoseLog from "../models/DoseLog.js";
import Schedule from "../models/Schedule.js";
import {asyncHandler} from "../utils/asyncHandler.js";

export const DashBoardSummary = asyncHandler(async (userId) => {
  const now = new Date();

  // Fetch all does for user with schedule details
  const doses = await Dose.find({ userId }).populate("ScheduleId");

  if (!doses.length) {
    return {
      adherence: 0,
      upcoming: [],
      missedTrends: {},
    };
  }

  //   Fetch logs for these doses
  const doseLogs = await DoseLog.find({
    doseId: { $in: doses.map((d) => d.doseId) },
  });

  //  Compute adherence %
  const takenDoses = doses.filter((d) => {
    const log = doseLogs.find((l) => l.doseId === d.doseId);
    return log?.action === "taken" || d.status === "taken";
  }).length;

  const totalDoses = doses.length;
  const adherence = (takenDoses / totalDoses) * 100;

  const upcoming = doses
    .filter((d) => d.status === "pending" && d.scheduledAt > now)
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 10) // limit to 10 for dashboard
    .map((d) => ({
      doseId: d.doseId,
      scheduledAt: d.scheduledAt,
      status: d.status,
      schedule: d.scheduleId, // populated schedule
    }));

  // 5️⃣ Missed trends (last 7 days)
  const missed = doses.filter((d) => {
    const log = doseLogs.find((l) => l.doseId === d.doseId);
    return log?.action === "missed" || d.status === "missed";
  });

  const missedTrends = missed.reduce((acc, dose) => {
    const day = dose.scheduledAt.toISOString().split("T")[0]; // YYYY-MM-DD
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return {
    adherence: adherence.toFixed(2),
    upcoming,
    missedTrends,
  };
});


