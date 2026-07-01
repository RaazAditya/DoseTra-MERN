import {
  formatMedicineForContext,
  checkInteractionBetweenMedicines,
} from "./medicineRetrievalService.js";

const RAG_SYSTEM_PROMPT = `You are DoseTra AI, a medication information assistant with access to a verified medicine knowledge base.

CRITICAL RULES - follow strictly to avoid hallucination:
1. Answer ONLY using the "Retrieved Medicine Facts" section below. Do NOT invent drug names, dosages, interactions, or medical facts.
2. If the retrieved facts do not contain enough information to answer, say: "I don't have verified information about that in my knowledge base." Do NOT guess.
3. When the user asks about multiple medicines, address EACH medicine separately with clear headings.
4. Clearly distinguish between different medicines. Never merge facts from one drug into another.
5. If a medicine is in the user's DoseTra profile but NOT in the retrieved facts, note that it is registered in their app but you lack detailed knowledge base data for it.
6. If the user asks for suggestions or alternatives, compare only medicines present in retrieved facts. Do not tell the user to start, stop, switch, or combine medicines.
7. For emergencies, overdose, or serious symptoms, direct to emergency services immediately.
8. Do not claim to know the user's dose history, adherence, or schedule unless explicitly provided in "User's DoseTra medicines".
9. Keep language simple and practical. Mention consulting a healthcare provider only for dose changes, stopping medication, or serious concerns.

RESPONSE FORMAT - always use this structure:
**Summary**
(1-2 sentences answering the main question)

**Medicine Details**
(For each relevant medicine, use a subheading with the medicine name)
- **What it is:** ...
- **Uses:** ...
- **How to take:** ...
- **Side effects:** ...
- **Interactions:** ...
- **Important warnings:** ...
(Only include sections that have data in the retrieved facts)

**Your DoseTra Profile** (only if user medicines are relevant)
(Brief note connecting retrieved facts to their registered medicines)

**Sources**
(List medicine names from the knowledge base that were used)`;

const NO_CONTEXT_PROMPT = `You are DoseTra AI. The medicine knowledge base returned no matching records for this query.

Rules:
- Do NOT invent medicine facts, dosages, or interactions.
- Tell the user you don't have verified information about the requested medicine(s) in the knowledge base yet.
- Suggest they verify with a pharmacist or doctor.
- If they ask about personal records (next dose, adherence, schedules), tell them to ask directly, e.g. "What's my next dose?"
- Keep the response brief and helpful.`;

const formatUserMedicines = (medicines = []) => {
  if (!medicines.length) return "No medicines registered in DoseTra yet.";
  return medicines
    .map(
      (m) =>
        `- ${m.name}: ${m.dosage}, ${m.form || "tablet"}, ${m.frequency}${m.instructions ? ` (${m.instructions})` : ""}`
    )
    .join("\n");
};

export const buildRagContext = ({
  userName = "there",
  timezone = "UTC",
  userMedicines = [],
  retrievalResult,
  userMessage,
}) => {
  const { documents, matchedNames, userMedicinesReferenced, hasKnowledgeBase } = retrievalResult;

  const userContext = [
    `User: ${userName}`,
    `Timezone: ${timezone}`,
    ``,
    `User's DoseTra medicines (personal records - NOT from knowledge base):`,
    formatUserMedicines(userMedicines),
  ].join("\n");

  if (!hasKnowledgeBase) {
    return {
      systemPrompt: `${NO_CONTEXT_PROMPT}\n\n${userContext}\n\nNote: The medicine knowledge base has not been loaded yet. Ask an admin to run the dataset ingest script.`,
      userMessage,
      sources: [],
      hasContext: false,
    };
  }

  if (!documents.length) {
    const askedAbout = matchedNames.length
      ? `The user mentioned: ${matchedNames.join(", ")}.`
      : "No specific medicine was matched.";

    return {
      systemPrompt: `${NO_CONTEXT_PROMPT}\n\n${userContext}\n\n${askedAbout}`,
      userMessage,
      sources: [],
      hasContext: false,
    };
  }

  const retrievedFacts = documents
    .map(
      (doc, i) =>
        `--- Document ${i + 1} (relevance: ${doc.relevanceScore?.toFixed(1) || "N/A"}) ---\n${formatMedicineForContext(doc)}`
    )
    .join("\n\n");

  const sources = documents.map((d) => d.name);

  const interactionHints = checkInteractionBetweenMedicines(documents);
  const interactionNote = interactionHints
    ? `\n\nCross-medicine interaction hints from knowledge base:\n${interactionHints
        .map((h) => `- ${h.from} interaction notes mention ${h.mentions}`)
        .join("\n")}`
    : "";

  const userMedNote =
    userMedicinesReferenced.length > 0
      ? `\n\nUser's query relates to these registered medicines: ${userMedicinesReferenced.map((m) => m.name).join(", ")}`
      : "";

  const systemPrompt = [
    RAG_SYSTEM_PROMPT,
    userContext,
    `\nRetrieved Medicine Facts (ONLY source of truth - do not add facts beyond this):`,
    retrievedFacts,
    interactionNote,
    userMedNote,
  ].join("\n\n");

  return {
    systemPrompt,
    userMessage,
    sources,
    hasContext: true,
  };
};

export const buildComparisonContext = (buildParams) => {
  const ctx = buildRagContext(buildParams);
  if (!ctx.hasContext) return ctx;

  ctx.systemPrompt +=
    "\n\nThe user is comparing medicines. Create a clear comparison section highlighting differences in drug class, uses, side effects, and interactions. Use a table-like format with bullet points for each medicine.";

  return ctx;
};
