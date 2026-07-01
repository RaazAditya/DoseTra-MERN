import MedicineKnowledge from "../../models/MedicineKnowledge.js";

const SCORE_WEIGHTS = {
  exactName: 10,
  aliasMatch: 8,
  textSearch: 5,
  categoryMatch: 3,
  partialName: 2,
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const mergeCandidates = (...groups) => {
  const byId = new Map();
  for (const group of groups) {
    for (const doc of group || []) {
      if (doc?._id) byId.set(doc._id.toString(), doc);
    }
  }
  return [...byId.values()];
};

const findKnowledgeForMedicineName = async (name) => {
  if (!name?.trim()) return [];
  const exact = new RegExp(`^${escapeRegex(name.trim())}$`, "i");
  return MedicineKnowledge.find({
    $or: [
      { name: exact },
      { genericName: exact },
      { brandNames: exact },
      { aliases: exact },
    ],
  })
    .limit(3)
    .lean();
};

const buildSearchText = (doc) => {
  const parts = [
    doc.name,
    doc.genericName,
    ...(doc.brandNames || []),
    ...(doc.aliases || []),
    doc.category,
    doc.drugClass,
    doc.uses,
    doc.mechanism,
    doc.dosage,
    doc.sideEffects,
    doc.interactions,
    doc.contraindications,
    doc.warnings,
    doc.foodInstructions,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
};

const scoreDocument = (doc, query, matchedNames = []) => {
  const q = query.toLowerCase();
  let score = 0;

  const names = [
    doc.name,
    doc.genericName,
    ...(doc.brandNames || []),
    ...(doc.aliases || []),
  ]
    .filter(Boolean)
    .map((n) => n.toLowerCase());

  for (const name of names) {
    if (q.includes(name)) {
      score += name === doc.name?.toLowerCase() ? SCORE_WEIGHTS.exactName : SCORE_WEIGHTS.aliasMatch;
    } else if (name.length > 3 && q.split(/\s+/).some((word) => name.includes(word) || word.includes(name))) {
      score += SCORE_WEIGHTS.partialName;
    }
  }

  for (const { alias } of matchedNames) {
    if (names.includes(alias.toLowerCase())) {
      score += SCORE_WEIGHTS.aliasMatch;
    }
  }

  if (doc.category && q.includes(doc.category.toLowerCase())) score += SCORE_WEIGHTS.categoryMatch;
  if (doc.drugClass && q.includes(doc.drugClass.toLowerCase())) score += SCORE_WEIGHTS.categoryMatch;

  const searchText = doc.searchText || buildSearchText(doc);
  const queryWords = q.split(/\s+/).filter((w) => w.length > 2);
  const matchedWords = queryWords.filter((w) => searchText.includes(w));
  score += (matchedWords.length / Math.max(queryWords.length, 1)) * SCORE_WEIGHTS.textSearch;

  return score;
};

export const formatMedicineForContext = (doc) => {
  const sections = [
    `Medicine: ${doc.name}`,
    doc.genericName && doc.genericName !== doc.name ? `Generic name: ${doc.genericName}` : null,
    doc.brandNames?.length ? `Brand names: ${doc.brandNames.join(", ")}` : null,
    doc.category ? `Category: ${doc.category}` : null,
    doc.drugClass ? `Drug class: ${doc.drugClass}` : null,
    doc.uses ? `Uses: ${doc.uses}` : null,
    doc.mechanism ? `How it works: ${doc.mechanism}` : null,
    doc.dosage ? `Typical dosage: ${doc.dosage}` : null,
    doc.forms?.length ? `Available forms: ${doc.forms.join(", ")}` : null,
    doc.sideEffects ? `Side effects: ${doc.sideEffects}` : null,
    doc.interactions ? `Drug interactions: ${doc.interactions}` : null,
    doc.contraindications ? `Contraindications: ${doc.contraindications}` : null,
    doc.warnings ? `Warnings: ${doc.warnings}` : null,
    doc.foodInstructions ? `Food instructions: ${doc.foodInstructions}` : null,
    doc.storage ? `Storage: ${doc.storage}` : null,
    doc.pregnancyCategory ? `Pregnancy: ${doc.pregnancyCategory}` : null,
  ].filter(Boolean);

  return sections.join("\n");
};

export const retrieveMedicineContext = async (query, userMedicines = [], options = {}) => {
  const { topK = 3, minScore = 2 } = options;

  const knowledgeCount = await MedicineKnowledge.estimatedDocumentCount();
  if (!knowledgeCount) {
    return {
      documents: [],
      matchedNames: [],
      userMedicinesReferenced: [],
      retrievalMethod: "none",
      hasKnowledgeBase: false,
    };
  }

  const normalizedQuery = normalize(query);
  const userMedicineMatches = userMedicines.filter((medicine) =>
    normalizedQuery.includes(normalize(medicine.name))
  );

  const userMedicineDocs = (
    await Promise.all(userMedicineMatches.map((medicine) => findKnowledgeForMedicineName(medicine.name)))
  ).flat();

  let textResults = [];
  try {
    textResults = await MedicineKnowledge.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(topK * 6)
      .lean();
  } catch {
    /* text index may not exist yet */
  }

  let fallbackResults = [];
  if (!textResults.length && !userMedicineDocs.length) {
    const significantWords = normalizedQuery
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 5);

    if (significantWords.length) {
      fallbackResults = await MedicineKnowledge.find({
        $or: significantWords.flatMap((word) => {
          const rx = new RegExp(escapeRegex(word), "i");
          return [{ name: rx }, { genericName: rx }, { aliases: rx }, { brandNames: rx }];
        }),
      })
        .limit(topK * 6)
        .lean();
    }
  }

  const candidates = mergeCandidates(userMedicineDocs, textResults, fallbackResults);
  const matchedNames = [
    ...userMedicineMatches.map((medicine) => medicine.name),
    ...candidates
      .filter((doc) => normalizedQuery.includes(normalize(doc.name)))
      .map((doc) => doc.name),
  ];

  const scored = candidates
    .map((doc) => ({
      doc,
      score: scoreDocument(
        doc,
        query,
        matchedNames.map((alias) => ({ alias }))
      ),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    documents: scored.map(({ doc, score }) => ({ ...doc, relevanceScore: score })),
    matchedNames: [...new Set(matchedNames)],
    userMedicinesReferenced: userMedicineMatches,
    retrievalMethod: userMedicineDocs.length ? "user_medicine_match" : scored.length ? "semantic_keyword" : "none",
    hasKnowledgeBase: true,
  };
};

export const checkInteractionBetweenMedicines = (documents) => {
  if (documents.length < 2) return null;

  const names = documents.map((d) => d.name);
  const interactions = documents.map((d) => ({
    name: d.name,
    text: d.interactions || "",
  }));

  const crossMentions = [];
  for (const source of interactions) {
    for (const target of names) {
      if (source.name === target) continue;
      if (source.text.toLowerCase().includes(target.toLowerCase())) {
        crossMentions.push({ from: source.name, mentions: target, detail: source.text });
      }
    }
  }

  return crossMentions.length ? crossMentions : null;
};
