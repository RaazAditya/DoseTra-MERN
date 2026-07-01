# Medicine RAG Workflow

DoseTra medicine chatbot flow:

```text
backend/data/medicine_dataset.csv
  -> chunk medicine text
  -> Gemini embeddings
  -> Chroma vector DB
  -> user query
  -> Gemini query embedding
  -> Chroma top-k similarity search
  -> retrieved medicine chunks
  -> Groq LLM answer
```

## Setup

1. Keep the CSV file at:

```text
backend/data/medicine_dataset.csv
```

2. Start Chroma separately:

```bash
docker run -p 8000:8000 chromadb/chroma
```

3. Configure backend environment:

```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
CHROMA_URL=http://localhost:8000
CHROMA_MEDICINE_COLLECTION=dosetra_medicine_knowledge
GEMINI_EMBEDDINGS_MODEL=text-embedding-004
```

4. Ingest the CSV into Chroma:

```bash
cd backend
npm run ingest:medicines -- --clear
```

For a quick smoke test, ingest only a few rows:

```bash
npm run ingest:medicines -- --clear --limit=20
```

The CSV is not inserted into MongoDB. MongoDB remains for user accounts, schedules, medicines, doses, and app data only.
