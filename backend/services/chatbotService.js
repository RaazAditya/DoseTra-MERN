import User from "../models/User.js";

import Medicine from "../models/Medicine.js";

import {

  detectIntent,

  isDatabaseIntent,

  isMedicineAdviceIntent,

} from "./chatbot/intentDetection.js";

import {

  handleDatabaseQuery,

  fetchUserMedicines,

} from "./chatbot/databaseQueryHandler.js";

import {

  buildMinimalAiContext,

  buildMedicineAdviceContext,

} from "./chatbot/aiContextBuilder.js";

import { askGroq } from "./chatbot/groqService.js";



const AI_FALLBACK =

  "I'm unable to provide AI health guidance right now. You can still ask about your personal records — try " +

  '"What\'s my next dose?", "Show my adherence analytics", or "List my medicines".';



export const processChatMessage = async (userId, message) => {

  const user = await User.findById(userId).select("name timezone").lean();

  if (!user) {

    return { reply: "User not found.", source: "database" };

  }



  const intent = detectIntent(message);

  const userName = user.name?.trim().split(/\s+/)[0] || "there";

  const timezone = user.timezone || "UTC";



  if (isDatabaseIntent(intent)) {

    const reply = await handleDatabaseQuery(intent, userId, userName, timezone);

    return { reply, source: "database" };

  }



  if (isMedicineAdviceIntent(intent)) {

    const medicines = await fetchUserMedicines(userId);

    const { systemPrompt, userMessage } = buildMedicineAdviceContext(

      { userName, medicines, timezone },

      message

    );



    try {

      const reply = await askGroq({ systemPrompt, userMessage, temperature: 0.65 });

      return { reply, source: "ai" };

    } catch (err) {

      console.error("Groq medicine advice error:", err.message);

      return { reply: AI_FALLBACK, source: "database" };

    }

  }



  const medicineCount = await Medicine.countDocuments({ userId });

  const { systemPrompt, userMessage } = buildMinimalAiContext(

    { medicineCount, timezone },

    message

  );



  try {

    const reply = await askGroq({ systemPrompt, userMessage });

    return { reply, source: "ai" };

  } catch (err) {

    console.error("Groq chat error:", err.message);

    return { reply: AI_FALLBACK, source: "database" };

  }

};


