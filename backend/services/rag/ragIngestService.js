import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import MedicineKnowledge from "../../models/MedicineKnowledge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildSearchText = (entry) => {
  const parts = [
    entry.name,
    entry.genericName,
    ...(entry.brandNames || []),
    ...(entry.aliases || []),
    entry.category,
    entry.drugClass,
    entry.uses,
    entry.mechanism,
    entry.dosage,
    entry.sideEffects,
    entry.interactions,
    entry.contraindications,
    entry.warnings,
    entry.foodInstructions,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
};

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
  const forms = ["tablet", "capsule", "syrup", "injection", "cream", "gel", "drops", "spray"]
    .filter((form) => lowered.includes(form));
  return forms.length ? forms : [];
};

const mapExternalDatasetEntry = (entry) => {
  const substitutes = compactList(pickNumberedFields(entry, "substitute"));
  const sideEffects = compactList(pickNumberedFields(entry, "sideEffect"));
  const uses = compactList(pickNumberedFields(entry, "use"));
  const chemicalClass = entry["Chemical Class"] || entry.chemicalClass || "";
  const therapeuticClass = entry["Therapeutic Class"] || entry.therapeuticClass || "";
  const actionClass = entry["Action Class"] || entry.actionClass || "";
  const habitForming = entry["Habit Forming"] || entry.habitForming || "";

  return {
    name: entry.name,
    genericName: entry.genericName || "",
    brandNames: splitListValue(entry.brandNames).concat(substitutes),
    aliases: splitListValue(entry.aliases).concat(substitutes),
    category: entry.category || therapeuticClass,
    drugClass: entry.drugClass || chemicalClass,
    uses: entry.uses || uses.join("; "),
    mechanism: entry.mechanism || (actionClass && actionClass.toLowerCase() !== "na" ? actionClass : ""),
    dosage: entry.dosage || "",
    forms: splitListValue(entry.forms).concat(inferFormsFromName(entry.name)),
    sideEffects: entry.sideEffects || sideEffects.join("; "),
    interactions: entry.interactions || "",
    contraindications: entry.contraindications || "",
    warnings:
      entry.warnings ||
      (habitForming && habitForming.toLowerCase() !== "na"
        ? `Habit forming: ${habitForming}`
        : ""),
    foodInstructions: entry.foodInstructions || "",
    storage: entry.storage || "",
    pregnancyCategory: entry.pregnancyCategory || "",
  };
};

const normalizeEntry = (entry) => {
  const mapped = mapExternalDatasetEntry(entry);
  const aliases = new Set(
    [
      mapped.name,
      mapped.genericName,
      ...(mapped.brandNames || []),
      ...(mapped.aliases || []),
    ]
      .filter(Boolean)
      .map((a) => a.toLowerCase().trim())
  );

  return {
    name: mapped.name?.trim(),
    genericName: mapped.genericName?.trim() || "",
    brandNames: [...new Set(mapped.brandNames || [])],
    aliases: [...aliases],
    category: mapped.category || "",
    drugClass: mapped.drugClass || "",
    uses: mapped.uses || "",
    mechanism: mapped.mechanism || "",
    dosage: mapped.dosage || "",
    forms: [...new Set(mapped.forms || [])],
    sideEffects: mapped.sideEffects || "",
    interactions: mapped.interactions || "",
    contraindications: mapped.contraindications || "",
    warnings: mapped.warnings || "",
    foodInstructions: mapped.foodInstructions || "",
    storage: mapped.storage || "",
    pregnancyCategory: mapped.pregnancyCategory || "",
    searchText: "",
  };
};

export const ingestMedicineDataset = async (entries, { clearExisting = false } = {}) => {
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error("Dataset must be a non-empty array of medicine objects");
  }

  if (clearExisting) {
    await MedicineKnowledge.deleteMany({});
  }

  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  const operations = [];

  for (const raw of entries) {
    try {
      if (!raw.name?.trim()) {
        results.skipped++;
        continue;
      }

      const normalized = normalizeEntry(raw);
      normalized.searchText = buildSearchText(normalized);

      operations.push({
        updateOne: {
          filter: { name: normalized.name },
          update: { $set: normalized },
          upsert: true,
        },
      });
    } catch (err) {
      results.errors.push({ name: raw.name, error: err.message });
    }
  }

  for (let i = 0; i < operations.length; i += 1000) {
    const batch = operations.slice(i, i + 1000);
    const result = await MedicineKnowledge.bulkWrite(batch, { ordered: false });
    results.inserted += result.upsertedCount || 0;
    results.updated += result.modifiedCount || 0;
  }

  return results;
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
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));
  const entries = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const entry = {};
    headers.forEach((h, idx) => {
      let val = values[idx]?.trim().replace(/^"|"$/g, "") || "";
      if (["brandNames", "aliases", "forms"].includes(h) && val) {
        entry[h] = val.split(";").map((v) => v.trim()).filter(Boolean);
      } else {
        entry[h] = val;
      }
    });
    if (entry.name) entries.push(entry);
  }

  return entries;
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
};

export const getDefaultSamplePath = () =>
  path.join(__dirname, "../../data/medicine-dataset.sample.json");

export const getKnowledgeBaseStats = async () => {
  const count = await MedicineKnowledge.countDocuments();
  const sample = await MedicineKnowledge.find({}).select("name category").limit(5).lean();
  return { count, sample };
};
