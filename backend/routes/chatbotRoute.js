import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import Medicine from "../models/Medicine.js";
import Dose from "../models/Dose.js";
import Schedule from "../models/Schedule.js";
import User from "../models/User.js"; // Import your User model

dotenv.config();

const router = express.Router();

// --- Helper function ---
const buildUserContext = (userName, medicines, schedules, doses) => {
  const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const medicineStr = medicines.length
    ? medicines.map(m =>
        `${m.name} (${m.dosage || "N/A"}, ${m.form || "tablet"}, ${m.frequency || "N/A"})${m.instructions ? ` — ${m.instructions}` : ""}`
      ).join("\n")
    : "No medicines found.";

  const scheduleStr = schedules.length
    ? schedules.map(s => {
        const medName = s.medicineId?.name || "Unknown";
        return `${medName} — Dosage: ${s.dosage || "N/A"}, Frequency: ${s.frequency || "N/A"}, Times: ${s.times?.join(", ") || "N/A"}, Active: ${s.active ? "✅" : "❌"}, Start: ${formatDateTime(s.startDate)}, End: ${formatDateTime(s.endDate)}`;
      }).join("\n")
    : "No schedules found.";

  const upcomingDosesStr = doses
    .filter(d => new Date(d.scheduledAt) >= new Date())
    .sort((a,b)=> new Date(a.scheduledAt)-new Date(b.scheduledAt))
    .slice(0,5)
    .map(d => {
      const medName = d.scheduleId?.medicineId?.name || "Unknown";
      return `💊 ${medName} scheduled on ${formatDateTime(d.scheduledAt)} (Status: ${d.status})`;
    }).join("\n") || "No upcoming doses.";

  const pastDosesStr = doses
    .filter(d => new Date(d.scheduledAt) < new Date())
    .sort((a,b)=> new Date(b.scheduledAt)-new Date(a.scheduledAt))
    .slice(0,5)
    .map(d => {
      const medName = d.scheduleId?.medicineId?.name || "Unknown";
      return `💊 ${medName} was on ${formatDateTime(d.scheduledAt)} (Status: ${d.status})`;
    }).join("\n") || "No past doses.";

  const takenCount = doses.filter(d => d.status === "taken").length;
  const missedCount = doses.filter(d => d.status === "missed").length;
  const pendingCount = doses.filter(d => d.status === "pending").length;

  const suggestions = [];
  if (missedCount>0) suggestions.push(`⚠️ You missed ${missedCount} dose(s). Try to be consistent.`);
  if (pendingCount>0) suggestions.push(`⏳ You have ${pendingCount} upcoming dose(s) pending.`);
  if (takenCount>0 && missedCount===0) suggestions.push(`🎉 Great job! You have taken all your doses so far!`);

  return `
Hello ${userName}! Here is your personalized dose summary:

USER DATA SUMMARY:
- Total medicines: ${medicines.length}
- Total schedules: ${schedules.length}
- Doses taken: ${takenCount}, missed: ${missedCount}, pending: ${pendingCount}

MEDICINES:
${medicineStr}

SCHEDULES:
${scheduleStr}

UPCOMING DOSES:
${upcomingDosesStr}

PAST DOSES:
${pastDosesStr}

SUGGESTIONS:
${suggestions.length ? suggestions.join("\n") : "Keep up the good work! 👍"}
`;
};

// --- Chatbot route ---
router.post("/", async (req, res) => {
  const { message, userId } = req.body;
  console.log("Chatbot request:", req.body);
   
  if (!message || !userId) {
    return res.status(400).json({ reply: "Login First to use DoseTra AI" });
  }

  try {
    // --- Fetch user info ---
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ reply: "User not found" });

    // --- Quick next dose response ---
    if (message.toLowerCase().includes("next medicine") || message.toLowerCase().includes("next dose")) {
      const doses = await Dose.find({ userId })
        .populate({ path: "scheduleId", populate: { path: "medicineId", select: "name" } })
        .sort({ scheduledAt: 1 });

      if (!doses.length) return res.json({ reply: `Hello ${user.name}, you don’t have any upcoming medicines 💊` });

      const nextDose = doses[0];
      return res.json({
        reply: `Hello ${user.name}, your next medicine is <b>${nextDose.scheduleId.medicineId.name}</b> at <b>${nextDose.scheduledAt.toLocaleString()}</b>.`,
      });
    }

    // --- Fetch all user data for context ---
    const [medicines, schedules, doses] = await Promise.all([
      Medicine.find({ userId }).lean(),
      Schedule.find({ userId }).populate("medicineId", "name dosage form frequency instructions").lean(),
      Dose.find({ userId }).populate({ path: "scheduleId", populate: { path: "medicineId", select: "name dosage form frequency instructions" } }).lean(),
    ]);

    const userContextStr = buildUserContext(user.name, medicines, schedules, doses);

    // --- Compose system prompt (MAT-specific) ---
const systemPrompt = `
You are DoseTra AI, a friendly assistant specialized in Medication Adherence Tracking (MAT).
Your goal is to help the user manage their medicines efficiently by providing accurate, clear, and polite guidance about:
- Upcoming doses
- Missed doses
- Medicine schedules
- Dosage instructions
- Notifications and reminders

Use the user information below (medicines, schedules, and doses) to answer their questions.
Always reply clearly and politely. Never make up data that is not in the user's records.
Format the reply in a user-friendly way, using emojis where appropriate to indicate medicines 💊, reminders ⏰, or alerts ⚠️.

User context:
${userContextStr}

User asked: "${message}"
`;


    // --- Call Gemini API ---
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generation_config: { max_output_tokens: 1024, temperature: 0.7 },
        }),
      }
    );

    const data = await geminiRes.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    let reply = "Sorry, I couldn’t understand that.";
    const candidate = data?.candidates?.[0];
    if (candidate) {
      if (candidate.content?.parts?.[0]?.text) {
        reply = candidate.content.parts[0].text;
      } else if (candidate.content?.text) {
        reply = candidate.content.text;
      }
    }

    res.json({ reply });
  } catch (error) {
    console.error("Chatbot route error:", error);
    res.status(500).json({ reply: "Server error while processing your request." });
  }
});

export default router;
