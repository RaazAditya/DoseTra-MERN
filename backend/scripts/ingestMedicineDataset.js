import "dotenv/config";
import {
  getLanceStats,
  getDefaultDatasetPath,
  ingestMedicineDatasetToLance,
  loadDatasetFromFile,
} from "../services/rag/lanceIngestService.js";

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

    const loadedEntries = loadDatasetFromFile(filePath);
    const entries = Number.isInteger(limit) && limit > 0
      ? loadedEntries.slice(0, limit)
      : loadedEntries;

    console.log(`Found ${entries.length} medicine entries`);

    const results = await ingestMedicineDatasetToLance(entries, {
      clearExisting: clearFlag,
      batchSize,
    });

    console.log("LanceDB ingest complete:", results);

    const stats = await getLanceStats();
    console.log(`LanceDB table "${stats.table}" now has ${stats.count} chunks`);
    process.exit(0);
  } catch (err) {
    console.error("========== ERROR ==========");
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  }
};

run();
