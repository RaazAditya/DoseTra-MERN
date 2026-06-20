import { asyncHandler } from "../utils/asyncHandler.js";
import { processChatMessage } from "../services/chatbotService.js";

export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({
      reply: "Please enter a message.",
      source: "database",
    });
  }

  const result = await processChatMessage(req.user._id, message.trim());
  res.json(result);
});
