import {
  fetchResolvedDoses,
  computeTimeOfDayRisks,
  computeHighRisk,
  getCachedPrediction,
  cachePrediction,
} from "./adherenceAnalyticsService.js";

export const computePredictions = async (userId, timezone = "UTC") => {
  const cached = await getCachedPrediction(userId);
  if (cached) return cached;

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 30);

  const resolved = await fetchResolvedDoses(userId, 30);

  if (!resolved.length) {
    return {
      morningRisk: 0,
      afternoonRisk: 0,
      eveningRisk: 0,
      nightRisk: 0,
      highRiskTime: null,
      riskPercentage: 0,
      message: "Not enough dose history yet. Log a few doses to unlock predictions.",
    };
  }

  const risks = computeTimeOfDayRisks(resolved, timezone);
  const { highRiskTime, riskPercentage } = computeHighRisk(risks);

  const prediction = {
    morningRisk: risks.morningRisk,
    afternoonRisk: risks.afternoonRisk,
    eveningRisk: risks.eveningRisk,
    nightRisk: risks.nightRisk,
    highRiskTime,
    riskPercentage,
    message: highRiskTime
      ? `You're most likely to miss doses in the ${highRiskTime} (${riskPercentage}% miss rate).`
      : "No high-risk time windows detected — keep up the good work!",
  };

  await cachePrediction(userId, prediction, windowStart, now);

  return prediction;
};
