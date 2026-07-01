import fetch from "node-fetch";

const DUCKDUCKGO_API_URL = "https://api.duckduckgo.com/";

const cleanText = (value = "") =>
  value
    .replace(/\s+/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const collectRelatedTopics = (topics = [], limit = 4) => {
  const results = [];

  const walk = (items) => {
    for (const item of items || []) {
      if (results.length >= limit) return;
      if (item.Text && item.FirstURL) {
        results.push({
          title: cleanText(item.Text.split(" - ")[0] || "DuckDuckGo result"),
          snippet: cleanText(item.Text),
          url: item.FirstURL,
        });
      }
      if (item.Topics?.length) walk(item.Topics);
    }
  };

  walk(topics);
  return results;
};

export const searchDuckDuckGo = async (query, { limit = 4 } = {}) => {
  if (!query?.trim()) return { results: [], source: "duckduckgo" };

  const params = new URLSearchParams({
    q: `${query} medicine side effects interactions dosage`,
    format: "json",
    no_html: "1",
    skip_disambig: "1",
  });

  const response = await fetch(`${DUCKDUCKGO_API_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed with status ${response.status}`);
  }

  const data = await response.json();
  const results = [];

  if (data.AbstractText) {
    results.push({
      title: cleanText(data.Heading || "DuckDuckGo instant answer"),
      snippet: cleanText(data.AbstractText),
      url: data.AbstractURL || data.Entity || "https://duckduckgo.com/",
    });
  }

  results.push(...collectRelatedTopics(data.RelatedTopics, limit - results.length));

  return {
    results: results.slice(0, limit),
    source: "duckduckgo",
  };
};

export const buildDuckDuckGoContext = ({ userName = "there", userMessage, searchResults }) => {
  const facts = searchResults
    .map(
      (result, index) =>
        `--- Web Result ${index + 1} ---\nTitle: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}`
    )
    .join("\n\n");

  return {
    systemPrompt: `You are DoseTra AI, a medication information assistant.

The local medicine knowledge base did not contain enough matching information, so DuckDuckGo search snippets are provided below.

Rules:
1. Answer ONLY from the DuckDuckGo snippets below. Do not invent missing dosage, safety, interaction, or treatment facts.
2. Say clearly that this answer came from web search, not the DoseTra verified medicine database.
3. If the snippets are not enough, say you could not verify the answer from available sources.
4. Do not recommend starting, stopping, switching, or combining medicines. Tell the user to ask a doctor or pharmacist for medical decisions.
5. For emergencies, overdose, breathing trouble, severe allergic reaction, chest pain, or severe symptoms, advise emergency care immediately.

User: ${userName}

DuckDuckGo Search Snippets:
${facts}`,
    userMessage,
    sources: searchResults.map((result) => ({
      title: result.title,
      url: result.url,
    })),
  };
};
