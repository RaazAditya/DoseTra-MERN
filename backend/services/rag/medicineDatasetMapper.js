import fs from "fs";
import path from "path";

const compactList = (values = []) =>
  values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value && value.toLowerCase() !== "na");

const pickNumberedFields = (entry, prefix) =>
  Object.keys(entry)
    .filter((key) => key.toLowerCase().startsWith(prefix.toLowerCase()))
    .sort((a, b) => {
      const aNum = Number(a.match(/\d+$/)?.[0] || 0);
      const bNum = Number(b.match(/\d+$/)?.[0] || 0);
      return aNum - bNum;
    })
    .map((key) => entry[key]);

const splitListValue = (value) => {
  if (Array.isArray(value)) return compactList(value);
  if (typeof value !== "string") return [];
  return compactList(value.split(/[;|]/));
};

const inferFormsFromName = (name = "") => {
  const lowered = name.toLowerCase();
  return ["tablet", "capsule", "syrup", "injection", "cream", "gel", "drops", "spray"].filter(
    (form) => lowered.includes(form)
  );
};

export const normalizeMedicineEntry = (entry) => {
  const substitutes = compactList(pickNumberedFields(entry, "substitute"));
  const sideEffects = compactList(pickNumberedFields(entry, "sideEffect"));
  const uses = compactList(pickNumberedFields(entry, "use"));
  const chemicalClass = entry["Chemical Class"] || entry.chemicalClass || "";
  const therapeuticClass = entry["Therapeutic Class"] || entry.therapeuticClass || "";
  const actionClass = entry["Action Class"] || entry.actionClass || "";
  const habitForming = entry["Habit Forming"] || entry.habitForming || "";

  const brandNames = [...new Set(splitListValue(entry.brandNames).concat(substitutes))];
  const aliases = [
    entry.name,
    entry.genericName,
    ...brandNames,
    ...splitListValue(entry.aliases),
  ]
    .filter(Boolean)
    .map((alias) => alias.toLowerCase().trim());

  return {
    id: entry.id || entry._id || entry.name,
    name: entry.name?.trim() || "",
    genericName: entry.genericName?.trim() || "",
    brandNames,
    aliases: [...new Set(aliases)],
    category: entry.category || therapeuticClass,
    drugClass: entry.drugClass || chemicalClass,
    uses: entry.uses || uses.join("; "),
    mechanism: entry.mechanism || (actionClass && actionClass.toLowerCase() !== "na" ? actionClass : ""),
    dosage: entry.dosage || "",
    forms: [...new Set(splitListValue(entry.forms).concat(inferFormsFromName(entry.name)))],
    sideEffects: entry.sideEffects || sideEffects.join("; "),
    interactions: entry.interactions || "",
    contraindications: entry.contraindications || "",
    warnings:
      entry.warnings ||
      (habitForming && habitForming.toLowerCase() !== "na" ? `Habit forming: ${habitForming}` : ""),
    foodInstructions: entry.foodInstructions || "",
    storage: entry.storage || "",
    pregnancyCategory: entry.pregnancyCategory || "",
  };
};

export const medicineEntryToText = (entry) => {
  const sections = [
    `Medicine: ${entry.name}`,
    entry.genericName && entry.genericName !== entry.name ? `Generic name: ${entry.genericName}` : null,
    entry.brandNames?.length ? `Substitutes or brand names: ${entry.brandNames.join(", ")}` : null,
    entry.category ? `Therapeutic class: ${entry.category}` : null,
    entry.drugClass ? `Chemical class: ${entry.drugClass}` : null,
    entry.uses ? `Uses: ${entry.uses}` : null,
    entry.mechanism ? `Action class or mechanism: ${entry.mechanism}` : null,
    entry.dosage ? `Typical dosage: ${entry.dosage}` : null,
    entry.forms?.length ? `Available forms: ${entry.forms.join(", ")}` : null,
    entry.sideEffects ? `Side effects: ${entry.sideEffects}` : null,
    entry.interactions ? `Drug interactions: ${entry.interactions}` : null,
    entry.contraindications ? `Contraindications: ${entry.contraindications}` : null,
    entry.warnings ? `Warnings: ${entry.warnings}` : null,
    entry.foodInstructions ? `Food instructions: ${entry.foodInstructions}` : null,
    entry.storage ? `Storage: ${entry.storage}` : null,
    entry.pregnancyCategory ? `Pregnancy: ${entry.pregnancyCategory}` : null,
  ].filter(Boolean);

  return sections.join("\n");
};

export const chunkText = (text, { maxChars = 1200, overlap = 120 } = {}) => {
  if (text.length <= maxChars) return [text];
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
};

export const loadDatasetFromFile = (filePath) => {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Dataset file not found: ${resolved}`);
  }

  const ext = path.extname(resolved).toLowerCase();
  const content = fs.readFileSync(resolved, "utf-8");

  if (ext === ".json") {
    return JSON.parse(content);
  }

  if (ext === ".csv") {
    return parseCsv(content);
  }

  throw new Error(`Unsupported file format: ${ext}. Use .json or .csv`);
};

const parseCsv = (content) => {
  const records = parseCsvRecords(content).filter((record) =>
    record.some((value) => value.trim())
  );
  if (records.length < 2) return [];

  const headers = records[0].map((header) => header.trim().replace(/^"|"$/g, ""));

  return records
    .slice(1)
    .map((values) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = values[index]?.trim().replace(/^"|"$/g, "") || "";
      });
      return entry;
    })
    .filter((entry) => entry.name);
};

const parseCsvRecords = (content) => {
  const records = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      records.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current);
    records.push(row);
  }

  return records;
};
