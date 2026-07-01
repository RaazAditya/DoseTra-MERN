import fetch from "node-fetch";

const DEFAULT_CHROMA_URL = "http://localhost:8000";
const DEFAULT_COLLECTION = "dosetra_medicine_knowledge";

const chromaUrl = () => (process.env.CHROMA_URL || DEFAULT_CHROMA_URL).replace(/\/$/, "");
export const getMedicineCollectionName = () =>
  process.env.CHROMA_MEDICINE_COLLECTION || DEFAULT_COLLECTION;

const request = async (path, options = {}) => {
  const response = await fetch(`${chromaUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Chroma request failed ${response.status} ${path}: ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const getOrCreateCollection = async (name = getMedicineCollectionName()) => {
  const collections = await request("/api/v1/collections");
  const existing = collections.find((collection) => collection.name === name);
  if (existing) return existing;

  return request("/api/v1/collections", {
    method: "POST",
    body: JSON.stringify({
      name,
      metadata: { description: "DoseTra medicine RAG knowledge chunks" },
    }),
  });
};

export const deleteCollection = async (name = getMedicineCollectionName()) => {
  const collections = await request("/api/v1/collections");
  const existing = collections.find((collection) => collection.name === name);
  if (!existing) return false;

  await request(`/api/v1/collections/${existing.id}`, { method: "DELETE" });
  return true;
};

export const addDocuments = async ({ collectionId, ids, documents, embeddings, metadatas }) => {
  if (!ids.length) return;

  await request(`/api/v1/collections/${collectionId}/upsert`, {
    method: "POST",
    body: JSON.stringify({
      ids,
      documents,
      embeddings,
      metadatas,
    }),
  });
};

export const queryDocuments = async ({ collectionId, queryEmbedding, topK = 4 }) =>
  request(`/api/v1/collections/${collectionId}/query`, {
    method: "POST",
    body: JSON.stringify({
      query_embeddings: [queryEmbedding],
      n_results: topK,
      include: ["documents", "metadatas", "distances"],
    }),
  });

export const countCollection = async (collectionId) =>
  request(`/api/v1/collections/${collectionId}/count`);
