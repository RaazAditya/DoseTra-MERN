import { embedTexts } from "./embeddingService.js";
import {
  countCollection,
  getOrCreateCollection,
  queryDocuments,
} from "./chromaClient.js";

const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const formatMedicineForContext = (doc) => doc.content || "";

const extractUserMedicineMatches = (query, userMedicines = []) => {
  const normalizedQuery = normalize(query);
  return userMedicines.filter((medicine) => {
    const medName = normalize(medicine.name);
    return medName && normalizedQuery.includes(medName);
  });
};

const mapChromaResults = (result) => {
  const documents = result.documents?.[0] || [];
  const metadatas = result.metadatas?.[0] || [];
  const distances = result.distances?.[0] || [];

  return documents.map((content, index) => {
    const metadata = metadatas[index] || {};
    const distance = distances[index];
    const relevanceScore = typeof distance === "number" ? Math.max(0, 1 - distance) : null;

    return {
      _id: `${metadata.medicineId || metadata.name || "medicine"}-${metadata.chunkIndex || index}`,
      name: metadata.name || "Medicine knowledge chunk",
      genericName: metadata.genericName || "",
      category: metadata.category || "",
      drugClass: metadata.drugClass || "",
      content,
      relevanceScore,
      source: metadata.source || "chroma",
    };
  });
};

export const retrieveMedicineContext = async (query, userMedicines = [], options = {}) => {
  const { topK = 4 } = options;

  try {
    const collection = await getOrCreateCollection();
    const count = await countCollection(collection.id);

    if (!count) {
      return {
        documents: [],
        matchedNames: [],
        userMedicinesReferenced: [],
        retrievalMethod: "none",
        hasKnowledgeBase: false,
      };
    }

    const [queryEmbedding] = await embedTexts([query]);
    const result = await queryDocuments({
      collectionId: collection.id,
      queryEmbedding,
      topK,
    });

    const documents = mapChromaResults(result);
    const userMedicinesReferenced = extractUserMedicineMatches(query, userMedicines);

    return {
      documents,
      matchedNames: [...new Set(documents.map((doc) => doc.name).filter(Boolean))],
      userMedicinesReferenced,
      retrievalMethod: documents.length ? "chroma_embedding" : "none",
      hasKnowledgeBase: true,
    };
  } catch (err) {
    console.error("Chroma retrieval error:", err.message);
    return {
      documents: [],
      matchedNames: [],
      userMedicinesReferenced: [],
      retrievalMethod: "none",
      hasKnowledgeBase: false,
      error: err.message,
    };
  }
};

export const checkInteractionBetweenMedicines = (documents) => {
  if (documents.length < 2) return null;

  const names = documents.map((doc) => doc.name).filter(Boolean);
  const crossMentions = [];

  for (const doc of documents) {
    const text = doc.content?.toLowerCase() || "";
    for (const name of names) {
      if (doc.name === name) continue;
      if (text.includes(name.toLowerCase())) {
        crossMentions.push({ from: doc.name, mentions: name, detail: doc.content });
      }
    }
  }

  return crossMentions.length ? crossMentions : null;
};
