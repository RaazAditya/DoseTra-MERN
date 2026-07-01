import path from "path";
import { fileURLToPath } from "url";
import { embedTexts } from "./embeddingService.js";
import {
  countCollection,
  getOrCreateCollection,
  queryDocuments,
} from "./chromaClient.js";
import {
  loadDatasetFromFile,
  medicineEntryToText,
  normalizeMedicineEntry,
} from "./medicineDatasetMapper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DATASET_PATH = path.join(__dirname, "../../data/medicine_dataset.csv");
let localMedicineCache = null;

const QUERY_STOPWORDS = new Set([
  "about",
  "and",
  "between",
  "better",
  "compare",
  "comparison",
  "difference",
  "different",
  "medicine",
  "medicines",
  "tablet",
  "tablets",
  "versus",
  "what",
  "which",
  "with",
]);

const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text = "") =>
  normalize(text)
    .split(/\s+/)
    .filter((token) => token.length >= 3);

const editDistance = (a = "", b = "") => {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
};

export const formatMedicineForContext = (doc) => doc.content || "";

const extractUserMedicineMatches = (query, userMedicines = []) => {
  const normalizedQuery = normalize(query);
  return userMedicines.filter((medicine) => {
    const medName = normalize(medicine.name);
    return medName && normalizedQuery.includes(medName);
  });
};

const getLocalMedicineCache = () => {
  if (localMedicineCache) return localMedicineCache;

  const rows = loadDatasetFromFile(LOCAL_DATASET_PATH);
  localMedicineCache = rows.map((raw) => {
    const medicine = normalizeMedicineEntry(raw);
    const aliases = [
      medicine.name,
      medicine.genericName,
      ...(medicine.brandNames || []),
      ...(medicine.aliases || []),
    ]
      .map(normalize)
      .filter(Boolean);

    return {
      medicine,
      aliases: [...new Set(aliases)],
      aliasTokens: [...new Set(aliases.flatMap(tokenize))],
      nameTokens: tokenize(medicine.name),
      normalizedName: normalize(medicine.name),
      text: medicineEntryToText(medicine),
    };
  });

  return localMedicineCache;
};

const scoreLocalMedicine = ({ aliases, aliasTokens }, query) => {
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);
  let score = 0;

  for (const alias of aliases) {
    const aliasParts = alias.split(/\s+/);
    if (normalizedQuery.includes(alias)) {
      score += alias.split(/\s+/).length > 1 ? 12 : 8;
    }

    for (const queryToken of queryTokens) {
      if (aliasParts[0] === queryToken) {
        score += 6;
      } else if (
        queryToken.length >= 5 &&
        aliasParts[0]?.length >= 5 &&
        editDistance(queryToken, aliasParts[0]) <= 1
      ) {
        score += 4;
      }
    }
  }

  for (const queryToken of queryTokens) {
    for (const aliasToken of aliasTokens) {
      if (queryToken === aliasToken) {
        score += 10;
      } else if (queryToken.length >= 5 && aliasToken.length >= 5 && editDistance(queryToken, aliasToken) <= 1) {
        score += 6;
      }
    }
  }

  return score;
};

const getQueryMedicineTokens = (query) =>
  tokenize(query).filter((token) => !QUERY_STOPWORDS.has(token) && !/^\d+$/.test(token));

const tokenMatchScore = ({ aliases, aliasTokens, nameTokens, normalizedName }, token) => {
  if (nameTokens[0] === token) return 100;
  if (nameTokens.includes(token)) return 90;
  if (token.length >= 5 && nameTokens[0]?.length >= 5 && editDistance(token, nameTokens[0]) <= 1) {
    return 80;
  }
  if (normalizedName.includes(token)) return 70;

  if (aliases.some((alias) => alias.split(/\s+/)[0] === token)) return 60;
  if (aliasTokens.includes(token)) return 50;
  if (
    token.length >= 5 &&
    aliasTokens.some((aliasToken) => aliasToken.length >= 5 && editDistance(token, aliasToken) <= 1)
  ) {
    return 40;
  }

  return 0;
};

const rankLocalCandidates = (query, topK) => {
  const cache = getLocalMedicineCache();
  const queryTokens = getQueryMedicineTokens(query);
  const selected = [];
  const selectedIds = new Set();

  for (const token of queryTokens) {
    const best = cache
      .map((item) => ({ ...item, score: tokenMatchScore(item, token) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0];

    const id = best?.medicine.id || best?.medicine.name;
    if (best && !selectedIds.has(id)) {
      selected.push(best);
      selectedIds.add(id);
    }
  }

  const generalMatches = cache
    .map((item) => ({ ...item, score: scoreLocalMedicine(item, query) }))
    .filter((item) => {
      const id = item.medicine.id || item.medicine.name;
      return item.score > 0 && !selectedIds.has(id);
    })
    .sort((a, b) => b.score - a.score);

  return selected.concat(generalMatches).slice(0, topK);
};

const retrieveFromLocalCsv = (query, userMedicines = [], topK = 4) => {
  try {
    const candidates = rankLocalCandidates(query, topK);

    const documents = candidates.map(({ medicine, text, score }, index) => ({
      _id: `local-csv-${medicine.id || medicine.name}-${index}`,
      name: medicine.name || "Medicine knowledge chunk",
      genericName: medicine.genericName || "",
      category: medicine.category || "",
      drugClass: medicine.drugClass || "",
      content: text,
      relevanceScore: score,
      source: "local_csv_fallback",
    }));

    return {
      documents,
      matchedNames: [...new Set(documents.map((doc) => doc.name).filter(Boolean))],
      userMedicinesReferenced: extractUserMedicineMatches(query, userMedicines),
      retrievalMethod: documents.length ? "local_csv_keyword_fallback" : "none",
      hasKnowledgeBase: documents.length > 0,
    };
  } catch (err) {
    console.error("Local CSV retrieval error:", err.message);
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
      return retrieveFromLocalCsv(query, userMedicines, topK);
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
    return retrieveFromLocalCsv(query, userMedicines, topK);
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
