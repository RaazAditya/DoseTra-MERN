import fetch from "node-fetch";

const DEFAULT_GEMINI_MODEL = "text-embedding-004";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const getEmbeddingConfig = () => ({
  apiUrl: process.env.GEMINI_EMBEDDINGS_API_URL || GEMINI_API_BASE,
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_EMBEDDINGS_MODEL || DEFAULT_GEMINI_MODEL,
});

const normalizeGeminiModel = (model) => model.replace(/^models\//, "");

export const embedTexts = async (texts = []) => {
  const input = texts.map((text) => text.trim()).filter(Boolean);
  if (!input.length) return [];

  const { apiUrl, apiKey, model } = getEmbeddingConfig();
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY to use medicine RAG embeddings");
  }

  const modelName = normalizeGeminiModel(model);
  const endpoint = `${apiUrl.replace(/\/$/, "")}/models/${modelName}:batchEmbedContents?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: input.map((text) => ({
        model: `models/${modelName}`,
        content: {
          parts: [{ text }],
        },
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini embedding API failed with ${response.status}: ${body}`);
  }

  const data = await response.json();
  return (data.embeddings || []).map((item) => item.values);
};
