import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import Medicine from "../models/Medicine.js";

dotenv.config();

const router = express.Router();

// POST /api/chatbot
router.post("/", async (req, res) => {
  const { message, userId } = req.body;

  if (!message || !userId) {
    return res.status(400).json({ reply: "Missing message or userId" });
  }

  try {
    // --- Handle "next medicine" query ---
    if (message.toLowerCase().includes("next medicine")) {
      const meds = await Medicine.find({ userId }).sort({ time: 1 });

      if (!meds.length) {
        return res.json({ reply: "You don’t have any upcoming medicines 💊" });
      }

      const nextMed = meds[0];
      return res.json({
        reply: `Your next medicine is <b>${nextMed.medicineName}</b> at <b>${nextMed.time.toLocaleString()}</b>.`,
      });
    }

    // --- Call Gemini 2.5-flash API ---
    const systemMessage = "You are a helpful assistant specialized in medicine management. Reply concisely and clearly.";
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemMessage}\nUser asked: ${message}`,
                },
              ],
            },
          ],
          generation_config: {
            max_output_tokens: 1024, // enough tokens to avoid MAX_TOKENS
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await geminiRes.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    // --- Extract reply safely ---
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
