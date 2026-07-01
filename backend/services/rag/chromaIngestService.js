import path from "path";
import { fileURLToPath } from "url";
import { embedTexts } from "./embeddingService.js";
import {
  addDocuments,
  countCollection,
  deleteCollection,
  getMedicineCollectionName,
  getOrCreateCollection,
} from "./chromaClient.js";
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

export const ingestMedicineDatasetToChroma = async (
  entries,
  { clearExisting = false, batchSize = 64 } = {}
) => {
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error("Dataset must be a non-empty array of medicine objects");
  }

  if (clearExisting) {
    await deleteCollection(getMedicineCollectionName());
  }

  const collection = await getOrCreateCollection();
  const results = { chunks: 0, medicines: 0, skipped: 0, errors: [] };
  let batch = [];

  const flush = async () => {
    if (!batch.length) return;

    const embeddings = await embedTexts(batch.map((item) => item.document));
    await addDocuments({
      collectionId: collection.id,
      ids: batch.map((item) => item.id),
      documents: batch.map((item) => item.document),
      metadatas: batch.map((item) => item.metadata),
      embeddings,
    });

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

      chunks.forEach((document, index) => {
        batch.push({
          id: `${medicineId}-${index}`,
          document,
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
  results.collectionCount = await countCollection(collection.id);
  return results;
};

export { loadDatasetFromFile };

export const getDefaultDatasetPath = () =>
  path.join(__dirname, "../../data/medicine_dataset.csv");

export const getChromaStats = async () => {
  const collection = await getOrCreateCollection();
  const count = await countCollection(collection.id);
  return { collection: collection.name, count };
};
