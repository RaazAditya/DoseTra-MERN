import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../db/database.js";
import {
  ingestMedicineDataset,
  loadDatasetFromFile,
  getDefaultSamplePath,
  getKnowledgeBaseStats,
} from "../services/rag/ragIngestService.js";

const args = process.argv.slice(2);
const clearFlag = args.includes("--clear");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
const fileArg = args.find((a) => !a.startsWith("--"));
const filePath = fileArg || getDefaultSamplePath();

const run = async () => {
  try {
    await connectDB();
    console.log(`Loading dataset from: ${filePath}`);

    const loadedEntries = loadDatasetFromFile(filePath);
    const entries = Number.isInteger(limit) && limit > 0
      ? loadedEntries.slice(0, limit)
      : loadedEntries;
    console.log(`Found ${entries.length} medicine entries`);

    const results = await ingestMedicineDataset(entries, { clearExisting: clearFlag });
    console.log("Ingest complete:", results);

    const stats = await getKnowledgeBaseStats();
    console.log(`Knowledge base now has ${stats.count} medicines`);
    if (stats.sample.length) {
      console.log("Sample entries:", stats.sample.map((s) => s.name).join(", "));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Ingest failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
