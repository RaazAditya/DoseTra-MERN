import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import {
  detectIntent,
  isDatabaseIntent,
  isMedicineAdviceIntent,
  isComparisonIntent,
} from "./chatbot/intentDetection.js";
import {
  handleDatabaseQuery,
  fetchUserMedicines,
} from "./chatbot/databaseQueryHandler.js";
import { buildMinimalAiContext } from "./chatbot/aiContextBuilder.js";
import { askGroq } from "./chatbot/groqService.js";
import { retrieveMedicineContext } from "./rag/medicineRetrievalService.js";
import { buildRagContext, buildComparisonContext } from "./rag/ragContextBuilder.js";
import {
  searchDuckDuckGo,
  buildDuckDuckGoContext,
} from "./rag/duckDuckGoSearchService.js";

const AI_FALLBACK =
  "I'm unable to provide AI health guidance right now. You can still ask about your personal records - try " +
  '"What\'s my next dose?", "Show my adherence analytics", or "List my medicines".';

const NO_KB_REPLY =
  "I don't have verified medicine information loaded yet. An admin needs to import the medicine dataset first. " +
  'You can still ask about your personal records - try "List my medicines" or "What\'s my next dose?"';

const NO_VERIFIED_REPLY =
  "I couldn't find enough verified medicine information in the DoseTra knowledge base or DuckDuckGo search results to answer that safely.";

const formatReplyHtml = (text) => {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "&bull; $1")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
};

const answerFromDuckDuckGo = async ({ message, userName }) => {
  const webSearch = await searchDuckDuckGo(message);

  if (!webSearch.results.length) {
    return { reply: NO_VERIFIED_REPLY, source: "database" };
  }

  const { systemPrompt, userMessage, sources } = buildDuckDuckGoContext({
    userName,
    userMessage: message,
    searchResults: webSearch.results,
  });

  const rawReply = await askGroq({
    systemPrompt,
    userMessage,
    temperature: 0.1,
    maxTokens: 700,
  });

  return {
    reply: formatReplyHtml(rawReply),
    source: "web",
    sources,
    retrievalMethod: "duckduckgo",
  };
};

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
    const retrievalResult = await retrieveMedicineContext(message, medicines, { topK: 4 });

    if (!retrievalResult.hasKnowledgeBase) {
      try {
        return await answerFromDuckDuckGo({ message, userName });
      } catch (err) {
        console.error("DuckDuckGo fallback error:", err.message);
        return { reply: NO_KB_REPLY, source: "database" };
      }
    }

    const buildContext = isComparisonIntent(message) ? buildComparisonContext : buildRagContext;
    const { systemPrompt, userMessage, sources, hasContext } = buildContext({
      userName,
      timezone,
      userMedicines: medicines,
      retrievalResult,
      userMessage: message,
    });

    if (!hasContext) {
      try {
        return await answerFromDuckDuckGo({ message, userName });
      } catch (err) {
        console.error("DuckDuckGo fallback error:", err.message);
        return { reply: NO_VERIFIED_REPLY, source: "database" };
      }
    }

    try {
      const rawReply = await askGroq({
        systemPrompt,
        userMessage,
        temperature: 0.2,
        maxTokens: 800,
      });

      return {
        reply: formatReplyHtml(rawReply),
        source: "rag",
        sources: sources || [],
        retrievalMethod: retrievalResult.retrievalMethod,
      };
    } catch (err) {
      console.error("Groq RAG error:", err.message);
      return { reply: AI_FALLBACK, source: "database" };
    }
  }

  const medicineCount = await Medicine.countDocuments({ userId });
  const { systemPrompt, userMessage } = buildMinimalAiContext(
    { medicineCount, timezone },
    message
  );

  try {
    const reply = await askGroq({ systemPrompt, userMessage, temperature: 0.5 });
    return { reply: formatReplyHtml(reply), source: "ai" };
  } catch (err) {
    console.error("Groq chat error:", err.message);
    return { reply: AI_FALLBACK, source: "database" };
  }
};
