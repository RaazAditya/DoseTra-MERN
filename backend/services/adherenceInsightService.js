import {
  fetchResolvedDoses,
  calcAdherenceRate,
  computeTimeOfDayRisks,
  computeHighRisk,
  computeMedicineBreakdown,
  computeDayOfWeekBreakdown,
  computeWeeklySummary,
  computeStreak,
  buildRecommendations,
  PERIOD_LABELS,
} from "./adherenceAnalyticsService.js";

export const buildAdherenceInsight = async (userId, timezone = "UTC") => {
  const resolved = await fetchResolvedDoses(userId, 30);

  if (!resolved.length) {
    return {
      adherencePercentage: 0,
      missedDoseCount: 0,
      mostMissedMedicine: null,
      mostMissedTime: null,
      weeklySummary: {
        rate: 0,
        taken: 0,
        missed: 0,
        total: 0,
        streak: 0,
        daily: [],
      },
      personalizedRecommendations: [
        "Start logging doses to unlock personalized adherence insights.",
      ],
      message: "Not enough dose history yet.",
    };
  }

  const overall = calcAdherenceRate(resolved);
  const weeklySummary = computeWeeklySummary(resolved, timezone);
  const medicineBreakdown = computeMedicineBreakdown(resolved);
  const dayBreakdown = computeDayOfWeekBreakdown(resolved, timezone);
  const risks = computeTimeOfDayRisks(resolved, timezone);
  const { highRiskTime, riskPercentage } = computeHighRisk(risks);
  const streak = computeStreak(resolved);

  const mostMissedMedicine = [...medicineBreakdown].sort((a, b) => b.missed - a.missed)[0] || null;

  const mostMissedDay = dayBreakdown[0] || null;
  const mostMissedTime = highRiskTime
    ? {
        period: highRiskTime,
        label: PERIOD_LABELS[highRiskTime],
        missRate: riskPercentage,
      }
    : mostMissedDay
      ? { period: mostMissedDay.day, label: mostMissedDay.day, missRate: mostMissedDay.missRate }
      : null;

  const personalizedRecommendations = buildRecommendations({
    adherencePercentage: overall.rate,
    highRiskTime,
    riskPercentage,
    mostMissedMedicine,
    streak,
    missedDoseCount: overall.missed,
  });

  let message;
  if (overall.rate >= 90) {
    message = `Excellent adherence at ${overall.rate}% over the last 30 days.`;
  } else if (highRiskTime && riskPercentage >= 40) {
    message = `Your adherence is ${overall.rate}%. Watch out for ${PERIOD_LABELS[highRiskTime]} doses — that's your highest-risk window.`;
  } else {
    message = `Your adherence is ${overall.rate}% with ${overall.missed} missed dose(s) in the last 30 days.`;
  }

  return {
    adherencePercentage: overall.rate,
    missedDoseCount: overall.missed,
    mostMissedMedicine: mostMissedMedicine
      ? {
          name: mostMissedMedicine.name,
          missed: mostMissedMedicine.missed,
          rate: mostMissedMedicine.rate,
        }
      : null,
    mostMissedTime,
    weeklySummary,
    personalizedRecommendations,
    message,
  };
};
