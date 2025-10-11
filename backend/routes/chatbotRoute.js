import express from "express";
import fetch from "node-fetch";
import Medicine from "../models/Medicine.js";

const router = express.Router();

// POST /api/chatbot
router.post("/", async (req, res) => {
  const { message, userId } = req.body;

  try {
    // Check if user asked for medicine schedule
    if (message.toLowerCase().includes("next medicine")) {
      const meds = await Medicine.find({ userId }).sort({ time: 1 });

      if (!meds.length) {
        return res.json({ reply: "You don’t have any upcoming medicines 💊" });
      }

      const nextMed = meds[0];
      return res.json({
        reply: `Your next medicine is ${nextMed.medicineName} at ${nextMed.time}.`,
      });
    }

    // Otherwise, send query to Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t understand that.";

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Server error while processing your request." });
  }
});

export default router;
