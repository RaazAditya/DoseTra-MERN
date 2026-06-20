import { getTimeZones } from "@vvo/tzdb";

const formatOffset = (minutes) => {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const mins = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${mins}`;
};

export const buildTimezoneOptions = () =>
  getTimeZones()
    .map((tz) => {
      const offset = formatOffset(tz.currentTimeOffsetInMinutes);
      const label = `${offset} — ${tz.name.replace(/_/g, " ")}`;
      const searchText = `${tz.name} ${tz.alternativeName || ""} ${tz.countryName || ""}`.toLowerCase();
      return {
        value: tz.name,
        label,
        offset: tz.currentTimeOffsetInMinutes,
        searchText,
      };
    })
    .sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label));

export const detectBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const findTimezoneOption = (options, value) =>
  options.find((option) => option.value === value) || null;
