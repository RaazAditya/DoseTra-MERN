import { asyncHandler } from "../utils/asyncHandler.js";
import { computePredictions } from "../services/aiPredictionService.js";
import { buildAdherenceInsight } from "../services/adherenceInsightService.js";

export const getPredict = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || "UTC";
  const prediction = await computePredictions(userId, timezone);
  res.json(prediction);
});

export const getAdherenceInsight = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || "UTC";
  const insight = await buildAdherenceInsight(userId, timezone);
  res.json(insight);
});
