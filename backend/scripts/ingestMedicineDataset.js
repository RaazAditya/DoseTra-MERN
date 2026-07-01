import "dotenv/config";
import {
  getChromaStats,
  getDefaultDatasetPath,
  ingestMedicineDatasetToChroma,
  loadDatasetFromFile,
} from "../services/rag/chromaIngestService.js";

const args = process.argv.slice(2);
const clearFlag = args.includes("--clear");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const batchArg = args.find((arg) => arg.startsWith("--batch="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
const batchSize = batchArg ? Number(batchArg.split("=")[1]) : 64;
const fileArg = args.find((arg) => !arg.startsWith("--"));
const filePath = fileArg || getDefaultDatasetPath();

const run = async () => {
  try {
    console.log(`Loading dataset from: ${filePath}`);
    console.log(`Chroma URL: ${process.env.CHROMA_URL || "http://localhost:8000"}`);

    const loadedEntries = loadDatasetFromFile(filePath);
    const entries = Number.isInteger(limit) && limit > 0
      ? loadedEntries.slice(0, limit)
      : loadedEntries;

    console.log(`Found ${entries.length} medicine entries`);

    const results = await ingestMedicineDatasetToChroma(entries, {
      clearExisting: clearFlag,
      batchSize,
    });

    console.log("Chroma ingest complete:", results);

    const stats = await getChromaStats();
    console.log(`Chroma collection "${stats.collection}" now has ${stats.count} chunks`);
    process.exit(0);
  } catch (err) {
    console.error("Chroma ingest failed:", err.message);
    process.exit(1);
  }
};

run();
