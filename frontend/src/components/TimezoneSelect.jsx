import React, { useMemo } from "react";
import Select from "react-select";
import { buildTimezoneOptions, detectBrowserTimezone, findTimezoneOption } from "@/lib/timezones";

const TimezoneSelect = ({
  value,
  onChange,
  placeholder = "Select your timezone",
  autoDetect = false,
  className = "",
}) => {
  const options = useMemo(() => buildTimezoneOptions(), []);

  const selectedValue = useMemo(() => {
    if (value) return findTimezoneOption(options, value);
    if (autoDetect) return findTimezoneOption(options, detectBrowserTimezone());
    return null;
  }, [value, options, autoDetect]);

  const filterOption = (option, input) => {
    if (!input) return true;
    return option.data.searchText.includes(input.toLowerCase());
  };

  return (
    <Select
      className={className}
      options={options}
      value={selectedValue}
      onChange={(selected) => onChange(selected?.value || "")}
      placeholder={placeholder}
      isSearchable
      filterOption={filterOption}
    />
  );
};

export default TimezoneSelect;
