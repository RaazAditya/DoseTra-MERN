import * as lancedb from "@lancedb/lancedb";
import path from "path";

export const TABLE_NAME = "medicine_knowledge";

const DB_PATH = path.join(
  process.cwd(),
  "storage",
  "medicine_vectors"
);

let db = null;
let table = null;

export const connectLanceDB = async () => {
  if (db) return db;

  db = await lancedb.connect(DB_PATH);
  console.log("DB_PATH:", DB_PATH);

  return db;
};

export const getOrCreateTable = async () => {
  if (table) return table;

  const db = await connectLanceDB();

  try {
    table = await db.openTable(TABLE_NAME);
    return table;
  } catch {
    return null;
  }
};

export const insertDocuments = async (rows) => {
  if (!rows.length) return;

  let table = await getOrCreateTable();

  if (!table) {
    const db = await connectLanceDB();

    try {
    table = await db.createTable(TABLE_NAME, rows);
} catch (err) {
    console.error("Failed to create LanceDB table:", err);
    throw err;
}
  } else {
    await table.add(rows);
  }

  return table;
};

export const searchDocuments = async ({
  queryEmbedding,
  topK = 4,
}) => {
  const table = await getOrCreateTable();

  if (!table) {
    console.log("LanceDB table not found.");
    return [];}

  return await table
    .search(queryEmbedding)
    .limit(topK)
    .toArray();
};

export const countDocuments = async () => {
  const table = await getOrCreateTable();

  if (!table) return 0;

  return await table.countRows();
};

export const deleteTable = async () => {
  const db = await connectLanceDB();

  try {
    await db.dropTable(TABLE_NAME);
  } catch(err){
    console.log(err);
  }

  table = null;
};