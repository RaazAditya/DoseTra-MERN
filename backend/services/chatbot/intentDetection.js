const DB_INTENTS = new Set([
  "GREETING",
  "NEXT_DOSE",
  "MISSED_DOSES",
  "ADHERENCE_ANALYTICS",
  "ADHERENCE",
  "SCHEDULES",
  "TODAY_SCHEDULE",
  "MEDICINES",
  "HELP",
]);

export const isDatabaseIntent = (intent) => DB_INTENTS.has(intent);

export const isMedicineAdviceIntent = (intent) => intent === "MEDICINE_ADVICE";

export const isComparisonIntent = (message) => {
  const msg = message.toLowerCase();
  return /\b(difference|differences|compare|comparison|vs\.?|versus|better|which one)\b/.test(msg);
};

export const detectIntent = (message) => {
  const msg = message.toLowerCase().trim();

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(msg)) {
    return "GREETING";
  }

  if (
    /\b(next|upcoming)\b.*\b(medicine|medication|dose|pill|med)\b/.test(msg) ||
    /\bnext\b.*\b(dose|medicine|medication|pill)\b/.test(msg) ||
    /\bwhen\b.*\b(next|take my)\b/.test(msg)
  ) {
    return "NEXT_DOSE";
  }

  if (
  /\bmiss(ed)?\b.*\b(dose|doses|medicine|medication|pill|med)\b/.test(msg) ||
  /\bforgot\b.*\b(dose|doses|medicine|medication|pill|med)\b/.test(msg) ||
  /\bforgotten\b.*\b(dose|doses|medicine|medication|pill|med)\b/.test(msg) ||
  /\bwhich\b.*\b(forgot|missed)\b/.test(msg) ||
  /\bwhat\b.*\b(forgot|missed)\b/.test(msg) ||
  /\bdoses?\b.*\b(forgot|missed)\b/.test(msg) ||
  /\bdid i miss\b/.test(msg)
) {
  return "MISSED_DOSES";
}

  if (
    /\b(analytic|analytics|statistics|stats|breakdown|detailed|insights?|trends?|report)\b.*\b(adherence|compliance|dose|medication)\b/.test(
      msg
    ) ||
    /\b(adherence|compliance)\b.*\b(analytic|analytics|statistics|stats|breakdown|detailed|insights?|trends?|report|by (day|week|medicine|med))\b/.test(
      msg
    ) ||
    /\b(which|what) (medicine|med)\b.*\b(miss|adherence|compliance|most|often|least|worst|best)\b/.test(msg) ||
    /\b(most|least|worst|best)\b.*\b(miss|forget|forgot|adherence|compliance)\b/.test(msg) ||
    /\b(per (medicine|med|day|week)|by (medicine|med|day|week))\b.*\b(adherence|compliance|miss|dose)\b/.test(
      msg
    ) ||
    /\b(per (medicine|med|day|week)|by (medicine|med|day|week))\b/.test(msg) ||
    /\b(weekly|monthly|daily)\b.*\b(adherence|compliance|breakdown|summary|stats)\b/.test(msg) ||
    /\b(adherence|compliance)\b.*\b(weekly|monthly|daily|over time|history|pattern)\b/.test(msg) ||
    /\b(how (has|have) my|show my)\b.*\b(adherence|compliance)\b.*\b(been|trend|over)\b/.test(msg) ||
    /\b(streak|consecutive days?|consistency score)\b/.test(msg) ||
    /\b(compare|comparison)\b.*\b(adherence|compliance|week|month)\b/.test(msg) ||
    /\bhow often\b.*\b(forget|forgot|miss|missed)\b/.test(msg) ||
    /\bwhich\b.*\bmedicine\b.*\b(miss|missed|forget|forgot)\b/.test(msg) ||
    /\bwhat\b.*\bdo i\b.*\b(forget|miss)\b/.test(msg) ||
    /\bhow many\b.*\b(doses?|medicines?)\b.*\b(miss|missed)\b/.test(msg) ||
    /\bmiss most\b/.test(msg) ||
    /\bforget most\b/.test(msg)
    
  ) {
    return "ADHERENCE_ANALYTICS";
  }

  if (
    /\badherence\b/.test(msg) ||
    /\bcompliance\b/.test(msg) ||
    /\bhow (am i|well am i) doing\b/.test(msg) ||
    /\bhow consistent\b/.test(msg) ||
    /\btaken rate\b/.test(msg) ||
    /\btrack(ing)? record\b/.test(msg)
  ) {
    return "ADHERENCE";
  }

  if (
    /\b(my )?(schedule|schedules|timing|timings)\b/.test(msg) ||
    /\bwhen do i take\b/.test(msg) ||
    /\bwhat time\b.*\b(take|medicine|medication|meds)\b/.test(msg)
  ) {
    return "SCHEDULES";
  }

  if (
    /\btoday'?s?\b.*\b(dose|doses|medicine|schedule|medication|meds)\b/.test(msg) ||
    /\b(dose|doses|medicine|medication)\b.*\btoday\b/.test(msg)
  ) {
    return "TODAY_SCHEDULE";
  }

  if (
    /\b(difference|differences|compare|comparison|vs\.?|versus|better|which one)\b/.test(msg) ||
    /\b(suggest|recommend|recommendation|alternative|substitute)\b.*\b(medicine|medication|meds?|pill|drug|tablet|capsule|syrup|injection|for)\b/.test(msg) ||
    /\b(side effects?|side-effects|adverse reactions?)\b/.test(msg) ||
    /\b(interact|interaction)\b/.test(msg) ||
    /\b(how (do|should|can) i take|when (should|do) i take)\b/.test(msg) ||
    /\b(with food|without food|empty stomach|before (meal|eating)|after (meal|eating)|with alcohol)\b/.test(
      msg
    ) ||
    /\b(is it safe|safe to)\b.*\b(take|stop|skip|double|combine|mix|drink)\b/.test(msg) ||
    /\b(should i|can i)\b.*\b(take|stop|skip|double|combine|mix)\b/.test(msg) ||
    /\b(what (is|does|are)|tell me about|explain)\b.*\b(medicine|medication|meds?|pill|drug|tablet|capsule|syrup)\b/.test(
      msg
    ) ||
    /\b(explain|tell me about|how does|how do)\b/.test(msg) ||
    /\b(overdose|too (much|many)|double (dose|up))\b/.test(msg) ||
    /\bwhat (if|happens if) i (miss|skip|forget)\b.*\b(dose|medicine|medication|med)\b/.test(msg) ||
    /\b(purpose of|used for|why (am i|do i))\b.*\b(take|taking|prescribed|medicine|medication|med)\b/.test(
      msg
    ) ||
    /\b(common|typical)\b.*\b(side effect|symptom|reaction)\b/.test(msg) ||
    /\b(vitamin|supplement|otc|over.the.counter)\b/.test(msg) ||
    /\b(medicine|medication|meds?|pill|drug)\b.*\b(advice|help|question|concern|worried|safe|danger|warning|risk)\b/.test(
      msg
    ) ||
    /\b(advice|help)\b.*\b(medicine|medication|meds?|pill|drug)\b/.test(msg)
  ) {
    return "MEDICINE_ADVICE";
  }

  if (
    /\b(list|show)\b.*\b(my )?(medicine|medicines|medication|medications|meds)\b/.test(msg) ||
    /\b(my )?(medicine|medicines|medication|medications|meds)\b.*\b(list|have|taking|on)\b/.test(msg) ||
    /\bwhat (medicine|medication|meds)\b.*\b(taking|on|have|am i)\b/.test(msg) ||
    /\bhow many\b.*\b(medicine|medicines|medication|medications|meds)\b/.test(msg)
  ) {
    return "MEDICINES";
  }

  if (
    /^(help|\?)$/.test(msg) ||
    /\bwhat can you (do|help)\b/.test(msg) ||
    /\bhow can you help\b/.test(msg)
  ) {
    return "HELP";
  }

  return "HEALTH_AI";
};
