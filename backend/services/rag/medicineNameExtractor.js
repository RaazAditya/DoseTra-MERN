const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildAliasIndex = (knowledgeDocs = [], userMedicines = []) => {
  const index = new Map();

  const addEntry = (alias, medicine) => {
    const key = normalize(alias);
    if (!key || key.length < 2) return;
    if (!index.has(key)) index.set(key, []);
    const existing = index.get(key);
    if (!existing.some((m) => m._id?.toString() === medicine._id?.toString())) {
      existing.push(medicine);
    }
  };

  for (const doc of knowledgeDocs) {
    addEntry(doc.name, doc);
    if (doc.genericName) addEntry(doc.genericName, doc);
    for (const brand of doc.brandNames || []) addEntry(brand, doc);
    for (const alias of doc.aliases || []) addEntry(alias, doc);
  }

  for (const med of userMedicines) {
    const pseudo = { _id: med._id, name: med.name, isUserMedicine: true, userMedicine: med };
    addEntry(med.name, pseudo);
  }

  return index;
};

export const extractMedicineNamesFromQuery = (query, aliasIndex) => {
  const msg = normalize(query);
  const matches = [];
  const seenIds = new Set();

  const sortedAliases = [...aliasIndex.keys()].sort((a, b) => b.length - a.length);

  for (const alias of sortedAliases) {
    const pattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
    if (pattern.test(msg)) {
      for (const med of aliasIndex.get(alias)) {
        const id = med._id?.toString() || med.name;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          matches.push({ alias, medicine: med });
        }
      }
    }
  }

  return matches;
};

export const resolveKnowledgeIds = (matches) => {
  const ids = new Set();
  for (const { medicine } of matches) {
    if (medicine.isUserMedicine) continue;
    ids.add(medicine._id.toString());
  }
  return [...ids];
};
