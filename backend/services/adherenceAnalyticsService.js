import Dose from "../models/Dose.js";
import AiPattern from "../models/AIPattern.js";
import User from "../models/User.js";

const DOSE_POPULATE = {
  path: "scheduleId",
  populate: { path: "medicineId", select: "name dosage form" },
};

export const PERIODS = ["morning", "afternoon", "evening", "night"];

export const PERIOD_LABELS = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night",
};

export const resolveDoseStatus = (dose, now = new Date()) => {
  if (dose.status === "taken" || dose.status === "missed") return dose.status;
  if (dose.status === "pending" && new Date(dose.scheduledAt) < now) return "missed";
  return null;
};

export const getHourInTimezone = (date, timezone = "UTC") => {
  try {
    return parseInt(
      new Date(date).toLocaleString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      }),
      10
    );
  } catch {
    return new Date(date).getHours();
  }
};

export const getPeriodForHour = (hour) => {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
};

export const getPeriodForDate = (date, timezone = "UTC") =>
  getPeriodForHour(getHourInTimezone(date, timezone));

export const fetchResolvedDoses = async (userId, days = 30) => {
  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - days);

  const doses = await Dose.find({
    userId,
    scheduledAt: { $gte: since, $lte: now },
  })
    .populate(DOSE_POPULATE)
    .sort({ scheduledAt: 1 })
    .lean();

  return doses
    .map((d) => ({ ...d, resolvedStatus: resolveDoseStatus(d, now) }))
    .filter((d) => d.resolvedStatus);
};

export const calcAdherenceRate = (doses) => {
  if (!doses.length) return { taken: 0, missed: 0, total: 0, rate: 0 };

  const taken = doses.filter((d) => d.resolvedStatus === "taken").length;
  const missed = doses.filter((d) => d.resolvedStatus === "missed").length;
  const total = taken + missed;

  return {
    taken,
    missed,
    total,
    rate: total ? Math.round((taken / total) * 100) : 0,
  };
};

export const computeTimeOfDayRisks = (resolvedDoses, timezone = "UTC") => {
  const stats = {
    morning: { total: 0, missed: 0 },
    afternoon: { total: 0, missed: 0 },
    evening: { total: 0, missed: 0 },
    night: { total: 0, missed: 0 },
  };

  for (const dose of resolvedDoses) {
    const period = getPeriodForDate(dose.scheduledAt, timezone);
    stats[period].total += 1;
    if (dose.resolvedStatus === "missed") stats[period].missed += 1;
  }

  const toRisk = (period) => {
    const { total, missed } = stats[period];
    return total ? Math.round((missed / total) * 100) : 0;
  };

  return {
    morningRisk: toRisk("morning"),
    afternoonRisk: toRisk("afternoon"),
    eveningRisk: toRisk("evening"),
    nightRisk: toRisk("night"),
    stats,
  };
};

export const computeHighRisk = ({ morningRisk, afternoonRisk, eveningRisk, nightRisk, stats }) => {
  const entries = PERIODS.map((period) => ({
    period,
    risk: { morning: morningRisk, afternoon: afternoonRisk, evening: eveningRisk, night: nightRisk }[
      period
    ],
    total: stats[period].total,
  })).filter((e) => e.total > 0);

  if (!entries.length) {
    return { highRiskTime: null, riskPercentage: 0 };
  }

  const highest = entries.reduce((best, current) =>
    current.risk > best.risk ? current : best
  );

  return {
    highRiskTime: highest.period,
    riskPercentage: highest.risk,
  };
};

export const computeStreak = (resolvedDoses, days = 7) => {
  const now = new Date();

  let streak = 0;
  for (let i = days - 1; i >= 0; i -= 1) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayDoses = resolvedDoses.filter((d) => {
      const t = new Date(d.scheduledAt);
      return t >= dayStart && t <= dayEnd;
    });

    if (!dayDoses.length) continue;
    if (dayDoses.every((d) => d.resolvedStatus === "taken")) streak += 1;
    else break;
  }

  return streak;
};

export const computeMedicineBreakdown = (resolvedDoses) => {
  const byMedicine = {};

  for (const dose of resolvedDoses) {
    const name = dose.scheduleId?.medicineId?.name || "Unknown";
    if (!byMedicine[name]) byMedicine[name] = { taken: 0, missed: 0 };
    if (dose.resolvedStatus === "taken") byMedicine[name].taken += 1;
    else byMedicine[name].missed += 1;
  }

  return Object.entries(byMedicine)
    .map(([name, stats]) => {
      const total = stats.taken + stats.missed;
      return {
        name,
        taken: stats.taken,
        missed: stats.missed,
        total,
        rate: total ? Math.round((stats.taken / total) * 100) : 0,
      };
    })
    .sort((a, b) => a.rate - b.rate);
};

export const computeDayOfWeekBreakdown = (resolvedDoses, timezone = "UTC") => {
  const byDay = {};

  for (const dose of resolvedDoses) {
    const day = new Date(dose.scheduledAt).toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    if (!byDay[day]) byDay[day] = { taken: 0, missed: 0 };
    if (dose.resolvedStatus === "taken") byDay[day].taken += 1;
    else byDay[day].missed += 1;
  }

  return Object.entries(byDay)
    .map(([day, stats]) => {
      const total = stats.taken + stats.missed;
      return {
        day,
        taken: stats.taken,
        missed: stats.missed,
        total,
        missRate: total ? Math.round((stats.missed / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.missed - a.missed);
};

export const computeWeeklySummary = (resolvedDoses, timezone = "UTC") => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const last7 = resolvedDoses.filter((d) => new Date(d.scheduledAt) >= sevenDaysAgo);
  const stats = calcAdherenceRate(last7);

  const daily = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (6 - i));
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayDoses = last7.filter((d) => {
      const t = new Date(d.scheduledAt);
      return t >= day && t <= dayEnd;
    });

    const taken = dayDoses.filter((d) => d.resolvedStatus === "taken").length;
    const missed = dayDoses.filter((d) => d.resolvedStatus === "missed").length;
    const total = taken + missed;

    return {
      date: day.toISOString().split("T")[0],
      taken,
      missed,
      adherence: total ? Math.round((taken / total) * 100) : 0,
    };
  });

  return {
    rate: stats.rate,
    taken: stats.taken,
    missed: stats.missed,
    total: stats.total,
    streak: computeStreak(last7),
    daily,
  };
};

export const buildRecommendations = ({
  adherencePercentage,
  highRiskTime,
  riskPercentage,
  mostMissedMedicine,
  streak,
  missedDoseCount,
}) => {
  const recommendations = [];

  if (streak >= 5) {
    recommendations.push(`Great job — you're on a ${streak}-day adherence streak! Keep it up.`);
  } else if (streak >= 3) {
    recommendations.push(`Nice work — ${streak} days in a row with all doses taken.`);
  }

  if (highRiskTime && riskPercentage >= 40) {
    recommendations.push(
      `You often miss your ${PERIOD_LABELS[highRiskTime]} doses (${riskPercentage}% miss rate). Try setting an extra reminder for that window.`
    );
  }

  if (mostMissedMedicine) {
    recommendations.push(
      `Focus on ${mostMissedMedicine.name} — it has your highest miss count (${mostMissedMedicine.missed} missed).`
    );
  }

  if (adherencePercentage < 70 && missedDoseCount > 0) {
    recommendations.push("Enable smart reminders to get personalized nudges when you're at risk of missing a dose.");
  }

  if (adherencePercentage >= 90) {
    recommendations.push("Your adherence is excellent — maintain your current routine.");
  }

  if (!recommendations.length) {
    recommendations.push("Keep logging doses daily so predictions stay accurate.");
  }

  return recommendations;
};

const PATTERN_CACHE_MS = 60 * 60 * 1000;

export const cachePrediction = async (userId, prediction, windowStart, windowEnd) => {
  const patternId = `${userId}-missedDose-predict`;

  await AiPattern.findOneAndUpdate(
    { patternId },
    {
      patternId,
      userId,
      patternType: "missedDose",
      probability: prediction.riskPercentage / 100,
      features: {
        morningRisk: prediction.morningRisk,
        afternoonRisk: prediction.afternoonRisk,
        eveningRisk: prediction.eveningRisk,
        nightRisk: prediction.nightRisk,
        highRiskTime: prediction.highRiskTime,
        riskPercentage: prediction.riskPercentage,
      },
      start: windowStart,
      end: windowEnd,
    },
    { upsert: true, new: true }
  );
};

export const getCachedPrediction = async (userId) => {
  const patternId = `${userId}-missedDose-predict`;
  const cached = await AiPattern.findOne({ patternId }).lean();

  if (!cached) return null;

  const age = Date.now() - new Date(cached.updatedAt).getTime();
  if (age > PATTERN_CACHE_MS) return null;

  return cached.features;
};

export const getPersonalizedReminderNote = async (userId, scheduledAt, timezone = "UTC") => {
  const resolved = await fetchResolvedDoses(userId, 30);
  if (!resolved.length) return null;

  const risks = computeTimeOfDayRisks(resolved, timezone);
  const { highRiskTime, riskPercentage } = computeHighRisk(risks);
  const streak = computeStreak(resolved);
  const dosePeriod = getPeriodForDate(scheduledAt, timezone);

  const notes = [];

  if (streak >= 5) {
    notes.push(`Great job, ${streak}-day adherence streak!`);
  }

  if (highRiskTime && dosePeriod === highRiskTime && riskPercentage >= 35) {
    notes.push(`You often miss your ${PERIOD_LABELS[highRiskTime]} dose — we've got your back.`);
  }

  return notes.length ? notes.join(" ") : null;
};

export const updateUserAiReminderNote = async (
  userId,
  scheduledAt = new Date()
) => {
  const user = await User.findById(userId);

  const timezone =
    user?.timezone || process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";

  const note = await getPersonalizedReminderNote(
    userId,
    scheduledAt,
    timezone
  );

  await User.findByIdAndUpdate(userId, {
    latestAiReminderNote: note || "",
  });

  return note;
};