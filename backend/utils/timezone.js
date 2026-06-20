export const isValidTimezone = (timezone) => {
  if (typeof timezone !== "string" || !timezone.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

export const resolveTimezone = (timezone, fallback = "UTC") =>
  isValidTimezone(timezone) ? timezone : fallback;

export const detectDefaultTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
