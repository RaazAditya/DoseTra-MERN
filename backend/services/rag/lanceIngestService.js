import {
  insertDocuments,
  countDocuments,
  deleteTable,
  TABLE_NAME,
} from "./lanceClient.js";
import path from "path";
import { fileURLToPath } from "url";
import { embedTexts } from "./embeddingService.js";
import {
  chunkText,
  loadDatasetFromFile,
  medicineEntryToText,
  normalizeMedicineEntry,
} from "./medicineDatasetMapper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stableId = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);

export const ingestMedicineDatasetToLance = async (
  entries,
  { clearExisting = false, batchSize = 64 } = {}
) => {
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error("Dataset must be a non-empty array of medicine objects");
  }

  if (clearExisting) {
    await deleteTable();
  }

  const results = { chunks: 0, medicines: 0, skipped: 0, errors: [] };
  let batch = [];

  const flush = async () => {
    if (!batch.length) return;

  const embeddings = await embedTexts(batch.map((item) => item.text));
    const rows = batch.map((item, index) => ({
    id: item.id,
    text: item.text,
    vector: embeddings[index],

    medicineId: item.metadata.medicineId,
    medicineName: item.metadata.name,
    genericName: item.metadata.genericName,
    category: item.metadata.category,
    drugClass: item.metadata.drugClass,
    source: item.metadata.source,
    chunkIndex: item.metadata.chunkIndex,
}));

    if (embeddings.length !== batch.length) {
  throw new Error("Embedding count mismatch");
}
    await insertDocuments(rows);

    results.chunks += batch.length;
    batch = [];
  };

  for (const raw of entries) {
    try {
      const medicine = normalizeMedicineEntry(raw);
      if (!medicine.name) {
        results.skipped += 1;
        continue;
      }

      const baseText = medicineEntryToText(medicine);
      const chunks = chunkText(baseText);
      const medicineId = stableId(`${medicine.id || medicine.name}-${medicine.name}`);

      chunks.forEach((text, index) => {
        batch.push({
          id: `${medicineId}-${index}`,
          text,
          metadata: {
            medicineId,
            name: medicine.name,
            genericName: medicine.genericName || "",
            category: medicine.category || "",
            drugClass: medicine.drugClass || "",
            source: "medicine_dataset_csv",
            chunkIndex: index,
          },
        });
      });

      results.medicines += 1;

      if (batch.length >= batchSize) {
        await flush();
      }
    } catch (err) {
      results.errors.push({ name: raw.name, error: err.message });
    }
  }

  await flush();
  results.tableCount = await countDocuments();
  results.tableName = TABLE_NAME;
  return results;
};

export { loadDatasetFromFile };

export const getDefaultDatasetPath = () =>
  path.join(__dirname, "../../data/medicine_dataset.csv");

export const getLanceStats = async () => {
  const count = await countDocuments();
  return { 
    table: "medicine_knowledge",
    count,
   };
};
