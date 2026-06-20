import Dose from "../../models/Dose.js";
import Schedule from "../../models/Schedule.js";
import Medicine from "../../models/Medicine.js";

const dosePopulate = {
  path: "scheduleId",
  populate: { path: "medicineId", select: "name dosage form" },
};

const formatDateTime = (date, timezone = "UTC") => {
  try {
    return new Date(date).toLocaleString("en-US", {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(date).toLocaleString();
  }
};

const formatTime = (date, timezone = "UTC") => {
  try {
    return new Date(date).toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
};

const getNextDose = async (userId, userName, timezone) => {
  const now = new Date();
  const nextDose = await Dose.findOne({
    userId,
    status: "pending",
    scheduledAt: { $gte: now },
  })
    .sort({ scheduledAt: 1 })
    .populate(dosePopulate)
    .lean();

  if (!nextDose) {
    return ` You have no upcoming doses scheduled. 💊`;
  }

  const medName = nextDose.scheduleId?.medicineId?.name || "your medicine";
  const when = formatDateTime(nextDose.scheduledAt, timezone);
  return `Your next dose is <b>${medName}</b> on <b>${when}</b>. 💊`;
};

const getMissedDoses = async (userId, userName, timezone) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const missed = await Dose.find({
    userId,
    status: "missed",
    scheduledAt: { $gte: weekAgo, $lte: now },
  })
    .sort({ scheduledAt: -1 })
    .limit(10)
    .populate(dosePopulate)
    .lean();

  const autoMissed = await Dose.find({
    userId,
    status: "pending",
    scheduledAt: { $lt: now, $gte: weekAgo },
  })
    .sort({ scheduledAt: -1 })
    .limit(10)
    .populate(dosePopulate)
    .lean();

  const allMissed = [...missed, ...autoMissed].sort(
    (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)
  );

  if (!allMissed.length) {
    return `Great news! You have no missed doses in the last 7 days. 🎉`;
  }

  const lines = allMissed.slice(0, 5).map((d) => {
    const medName = d.scheduleId?.medicineId?.name || "Unknown";
    return `• ${medName} — ${formatDateTime(d.scheduledAt, timezone)}`;
  });

  return `You have <b>${allMissed.length}</b> missed dose(s) in the last 7 days:<br>${lines.join("<br>")}<br><br>⚠️ Try to stay consistent and consult your doctor if you miss doses often.`;
};

const getAdherence = async (userId, userName) => {
  const doses = await Dose.find({ userId, status: { $in: ["taken", "missed"] } }).lean();

  if (!doses.length) {
    return ` you don't have enough dose history yet. Start logging doses to track adherence! 📊`;
  }

  const taken = doses.filter((d) => d.status === "taken").length;
  const missed = doses.filter((d) => d.status === "missed").length;
  const total = taken + missed;
  const rate = Math.round((taken / total) * 100);

  let message = `Your adherence rate is <b>${rate}%</b> (${taken} taken, ${missed} missed). 📊`;
  if (rate >= 90) message += "<br>🎉 Excellent work staying on track!";
  else if (rate >= 70) message += "<br>👍 Good progress — keep it up!";
  else message += "<br>⚠️ Consider setting reminders to improve consistency.";

  return message;
};

const resolveDoseStatus = (dose, now) => {
  if (dose.status === "taken" || dose.status === "missed") return dose.status;
  if (dose.status === "pending" && new Date(dose.scheduledAt) < now) return "missed";
  return null;
};

const calcAdherenceRate = (doses, now) => {
  const resolved = doses
    .map((d) => ({ ...d, resolvedStatus: resolveDoseStatus(d, now) }))
    .filter((d) => d.resolvedStatus);

  if (!resolved.length) return null;

  const taken = resolved.filter((d) => d.resolvedStatus === "taken").length;
  const missed = resolved.filter((d) => d.resolvedStatus === "missed").length;
  const total = taken + missed;

  return { taken, missed, total, rate: Math.round((taken / total) * 100) };
};

const getAdherenceAnalytics = async (userId, userName, timezone = "UTC") => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const doses = await Dose.find({
    userId,
    scheduledAt: { $gte: thirtyDaysAgo, $lte: now },
  })
    .populate(dosePopulate)
    .sort({ scheduledAt: 1 })
    .lean();

  const resolvedDoses = doses
    .map((d) => ({ ...d, resolvedStatus: resolveDoseStatus(d, now) }))
    .filter((d) => d.resolvedStatus);

  if (!resolvedDoses.length) {
    return `You don't have enough dose history for analytics yet. Log a few doses first, then ask again! 📊`;
  }

  const last7 = resolvedDoses.filter((d) => new Date(d.scheduledAt) >= sevenDaysAgo);
  const weekStats = calcAdherenceRate(last7, now);
  const monthStats = calcAdherenceRate(resolvedDoses, now);

  const byMedicine = {};
  for (const dose of resolvedDoses) {
    const medName = dose.scheduleId?.medicineId?.name || "Unknown";
    if (!byMedicine[medName]) byMedicine[medName] = { taken: 0, missed: 0 };
    if (dose.resolvedStatus === "taken") byMedicine[medName].taken += 1;
    else byMedicine[medName].missed += 1;
  }

  const medicineRows = Object.entries(byMedicine)
    .map(([name, stats]) => {
      const total = stats.taken + stats.missed;
      const rate = Math.round((stats.taken / total) * 100);
      return { name, ...stats, total, rate };
    })
    .sort((a, b) => a.rate - b.rate);

  const bestMed = medicineRows[medicineRows.length - 1];
  const worstMed = medicineRows[0];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDay = {};
  for (const dose of last7) {
    const dayKey = new Date(dose.scheduledAt).toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    if (!byDay[dayKey]) byDay[dayKey] = { taken: 0, missed: 0 };
    if (dose.resolvedStatus === "taken") byDay[dayKey].taken += 1;
    else byDay[dayKey].missed += 1;
  }

  const dailyLines = dayNames
    .filter((day) => byDay[day])
    .map((day) => {
      const stats = byDay[day];
      const total = stats.taken + stats.missed;
      const rate = Math.round((stats.taken / total) * 100);
      return `• ${day}: ${rate}% (${stats.taken}/${total} taken)`;
    });

  let streak = 0;
  for (let i = 6; i >= 0; i -= 1) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayDoses = last7.filter((d) => {
      const t = new Date(d.scheduledAt);
      return t >= dayStart && t <= dayEnd;
    });

    if (!dayDoses.length) continue;
    if (dayDoses.every((d) => d.resolvedStatus === "taken")) streak += 1;
    else break;
  }

  const medBreakdown = medicineRows
    .slice(0, 5)
    .map((m) => `• <b>${m.name}</b>: ${m.rate}% (${m.taken}/${m.total} taken)`)
    .join("<br>");

  let message =
    `Here's your adherence analytics (last 30 days): 📊<br><br>` +
    `<b>Overall</b><br>` +
    `• Last 7 days: <b>${weekStats.rate}%</b> (${weekStats.taken} taken, ${weekStats.missed} missed)<br>` +
    `• Last 30 days: <b>${monthStats.rate}%</b> (${monthStats.taken} taken, ${monthStats.missed} missed)<br>` +
    `• Current streak: <b>${streak}</b> day(s) with all doses taken<br><br>`;

  if (medicineRows.length > 1) {
    message +=
      `<b>By medicine</b><br>${medBreakdown}<br>` +
      `<br>Best: <b>${bestMed.name}</b> (${bestMed.rate}%) · Needs attention: <b>${worstMed.name}</b> (${worstMed.rate}%)<br><br>`;
  } else if (medicineRows.length === 1) {
    message += `<b>By medicine</b><br>${medBreakdown}<br><br>`;
  }

  if (dailyLines.length) {
    message += `<b>Last 7 days</b><br>${dailyLines.join("<br>")}`;
  }

  return message;
};

export const fetchUserMedicines = async (userId) =>
  Medicine.find({ userId }).sort({ name: 1 }).lean();

const getSchedules = async (userId, userName) => {
  const schedules = await Schedule.find({ userId, active: true })
    .populate("medicineId", "name dosage form")
    .sort({ startDate: 1 })
    .lean();

  if (!schedules.length) {
    return ` You don't have any active schedules yet. Add a medicine schedule to get started. 📅`;
  }

  const lines = schedules.map((s) => {
    const medName = s.medicineId?.name || "Unknown";
    const times = s.times?.length ? s.times.join(", ") : "Not set";
    return `• <b>${medName}</b> — ${s.dosage || s.medicineId?.dosage || "N/A"}, ${s.frequency || "N/A"}, times: ${times}`;
  });

  return `Here are your active schedules:<br>${lines.join("<br>")}`;
};

const getMedicines = async (userId, userName) => {
  const medicines = await Medicine.find({ userId }).sort({ name: 1 }).lean();

  if (!medicines.length) {
    return `You haven't added any medicines yet. Add one from the Medicines page. 💊`;
  }

  const lines = medicines.map(
    (m) =>
      `• <b>${m.name}</b> — ${m.dosage}, ${m.form || "tablet"}, ${m.frequency}${m.instructions ? ` (${m.instructions})` : ""}`
  );

  return `You have ${medicines.length} medicine(s):<br>${lines.join("<br>")}`;
};

const getTodaySchedule = async (userId, userName, timezone) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const doses = await Dose.find({
    userId,
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ scheduledAt: 1 })
    .populate(dosePopulate)
    .lean();

  if (!doses.length) {
    return `You have no doses scheduled for today. 📅`;
  }

  const lines = doses.map((d) => {
    const medName = d.scheduleId?.medicineId?.name || "Unknown";
    const statusIcon = d.status === "taken" ? "✅" : d.status === "missed" ? "❌" : "⏳";
    return `${statusIcon} ${medName} — ${formatTime(d.scheduledAt, timezone)} (${d.status})`;
  });

  return `Today's schedule:<br>${lines.join("<br>")}`;
};

const getHelp = (userName) =>
  `I'm your DoseTra Health Assistant. I can help with:<br><br>` +
  `📊 <b>Your records</b> (answered from your data):<br>` +
  `• "What's my next dose?"<br>` +
  `• "Show my missed doses"<br>` +
  `• "What's my adherence?"<br>` +
  `• "Show my adherence analytics" / "Breakdown by medicine"<br>` +
  `• "List my medicines" / "Show my schedules"<br>` +
  `• "What's on my schedule today?"<br><br>` +
  `💊 <b>Medicine advice</b> (personalized using your medicines + AI):<br>` +
  `• "What are the side effects of my medicines?"<br>` +
  `• "Should I take my meds with food?"<br>` +
  `• "Explain how metformin works"<br><br>` +
  `🤖 <b>General health guidance</b>:<br>` +
  `• "Tips for remembering to take medicine?"<br><br>` +
  `For personal medical decisions, always consult your healthcare provider.`;

const getGreeting = (userName) =>
  `Hello ${userName}! Type <b>help</b> to see what I can do.`;

export const handleDatabaseQuery = async (intent, userId, userName, timezone = "UTC") => {
  switch (intent) {
    case "NEXT_DOSE":
      return getNextDose(userId, userName, timezone);
    case "MISSED_DOSES":
      return getMissedDoses(userId, userName, timezone);
    case "ADHERENCE":
      return getAdherence(userId, userName);
    case "ADHERENCE_ANALYTICS":
      return getAdherenceAnalytics(userId, userName, timezone);
    case "SCHEDULES":
      return getSchedules(userId, userName);
    case "MEDICINES":
      return getMedicines(userId, userName);
    case "TODAY_SCHEDULE":
      return getTodaySchedule(userId, userName, timezone);
    case "HELP":
      return getHelp(userName);
    case "GREETING":
      return getGreeting(userName);
    default:
      return getHelp(userName);
  }
};
