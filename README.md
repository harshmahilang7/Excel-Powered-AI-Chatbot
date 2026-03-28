# Excel-Powered AI Chatbot

A full-stack reference implementation showing how to build a **production-quality, data-aware AI chatbot** on top of tabular data (Excel / CSV) — without a vector database, without embeddings, and without a backend server.

Upload any structured spreadsheet. Ask questions in plain English. Get streamed, markdown-rich answers grounded entirely in your data.

---

## What This Demonstrates

This project is an end-to-end example of a **Retrieval-Augmented Generation (RAG) pipeline** built for structured data. The key design insight is that for tabular data — names, IDs, categories, numeric fields — **fuzzy text search outperforms vector similarity search** in both accuracy and latency, at zero embedding cost.

| Concern | Approach used | Why |
|---|---|---|
| Data ingestion | SheetJS (xlsx) | Parses `.xlsx`, `.xls`, `.csv` in-process — no storage layer needed |
| Search | Fuse.js fuzzy search | Exact and near-exact matches on structured fields; no GPU, no API call |
| Fallback retrieval | Token-based scan | Handles long natural-language queries that Fuse misses |
| LLM answering | Groq + LLaMA 3.3 70B | Fast inference; model never sees raw data it doesn't need |
| Streaming | NDJSON over `ReadableStream` | Token-by-token delivery; no buffering, no timeout risk |
| Session state | `globalThis` in-process store | No Redis/DB dependency; survives Next.js HMR in dev |

---

## Architecture

```
Browser                             Next.js Server (Node.js)
──────────────────────────────      ─────────────────────────────────────────

POST /api/upload ──────────────▶   parseExcelBuffer()
  FormData { file, sessionId }         └─ validate headers, rows, types
                                        └─ computeColumnStats()
                                     buildSearchIndex()   ← Fuse.js
                                     saveSession()        ← globalThis Map
  ◀──── JSON { headers, stats } ─────────────────────────────────────────

POST /api/chat ─────────────────▶  getSession(sessionId)
  { query, sessionId }               └─ isAggregate? → slice all rows
                                     └─ searchRows()  → Fuse full-query pass
                                     └─ per-token pass if 0 results
                                     └─ fallbackSearch() if still 0
                                    streamAnswer()         ← Groq SDK stream:true
  ◀──── NDJSON stream ────────────     { type:"meta", matchedRows }
         line by line                  { type:"chunk", text:"…" }  × N
                                       { type:"done" }
```

### Search Pipeline (two-pass + fallback)

```
User query: "what room does john from cse-a go to?"
                 │
                 ▼
         Pass 1: full query
         fuse.search("what room does john…")
                 │
         ┌───────┴──────────┐
         │ results > 0?     │ no results
         │ yes              ▼
         ▼         tokenize → ["room","john","cse"]  ← stop-words removed
       return        per-token Fuse search × 3
                     rank by hit-count across tokens
                              │
                     ┌────────┴────────┐
                     │ results > 0?    │ still nothing
                     │ yes             ▼
                     ▼        fallbackSearch()
                   return     plain substring scan
```

### Session Lifecycle

```
Upload                                        2h TTL
  │                                              │
  └─ saveSession(uuid, parsedExcel, fuseIndex) ──┤
                                                 │  each GET refreshes TTL
  Chat  ─── getSession(uuid) ──────────────────▶│
                                                 │
  Reset ─── DELETE /api/session ─────────────────┘─ clearSession()
```

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout, metadata, PWA viewport
│   ├── page.tsx                # Home: two-panel layout (sidebar + chat)
│   ├── about/
│   │   └── page.tsx            # Architecture explainer page
│   └── api/
│       ├── upload/route.ts     # File ingestion + session creation
│       ├── chat/route.ts       # NDJSON streaming chat endpoint
│       └── session/route.ts    # Session cleanup (DELETE)
│
├── components/
│   ├── ChatInterface.tsx       # Streaming fetch, phase indicators, history
│   ├── ChatMessage.tsx         # Markdown rendering, copy button, cursor
│   ├── DbStats.tsx             # Column analytics bar chart widget
│   └── FileUpload.tsx          # Drag-and-drop upload with progress
│
├── lib/
│   ├── excel-parser.ts         # SheetJS parsing + edge-case validation
│   ├── search.ts               # Fuse.js index, two-pass search, suggestMatches
│   ├── groq.ts                 # generateAnswer + streamAnswer (stream:true)
│   └── session-store.ts        # globalThis session map with TTL
│
├── types/
│   └── index.ts                # Shared TypeScript interfaces + StreamEvent
│
└── public/
    └── manifest.json           # PWA manifest
```

---

## Features

### Core
- **Upload any spreadsheet** — `.xlsx`, `.xls`, `.csv`; up to 10 MB; up to 100 columns
- **Natural language queries** — ask in full sentences, typos handled
- **Streamed AI answers** — tokens arrive as they're generated; phase indicator shows "Searching…" → "Generating…"
- **Markdown responses** — bold, bullet points, tables rendered inline

### Search Intelligence
- **Two-pass Fuse.js search** — full query first, then per-meaningful-token
- **Stop-word filtering** — removes noise words before token search
- **Aggregate query detection** — "how many", "list all", "count" triggers full-dataset pass instead of search
- **"Did you mean?"** — when 0 results, suggests closest name matches from the dataset

### UX
- **Copy to clipboard** — one-click copy on every AI message (appears on hover)
- **Chat history persistence** — last 50 messages saved to `localStorage`; survives page refresh
- **Database analytics widget** — bar chart breakdown of low-cardinality columns (section, course, block, etc.) in the sidebar
- **Character counter** — appears at 400+ chars, turns red at limit
- **Responsive two-panel layout** — sidebar collapses on mobile; menu toggle
- **PWA installable** — manifest + Apple web app meta tags; works as standalone mobile app

### Robustness (Edge Cases Handled)
- Blank file, headers-only file, single-column file, all-empty rows
- Corrupted or password-protected Excel
- Oversized file (>10 MB) or zero-byte file
- Wrong file type (non-.xlsx/.xls/.csv)
- Non-tabular / irrelevant data (warning shown, still functional)
- Empty or all-null columns auto-removed
- Cells truncated at 500 chars; columns capped at 100
- Expired or missing session (clear re-upload prompt)
- Groq rate limit → user-friendly message
- Groq auth failure → admin contact prompt
- Query too short (<2 chars) or too long (>500 chars)

---

## Tech Stack

| Package | Version | Role |
|---|---|---|
| `next` | 16.2.1 | Full-stack framework (App Router, Route Handlers) |
| `react` | 19 | UI with hooks |
| `groq-sdk` | ^1.1.2 | Groq API client (streaming completions) |
| `fuse.js` | ^7.1.0 | In-memory fuzzy search |
| `xlsx` (SheetJS) | ^0.18.5 | Excel/CSV parsing |
| `react-markdown` + `remark-gfm` | latest | Markdown rendering in chat |
| `react-dropzone` | ^15 | Drag-and-drop file upload |
| `tailwindcss` | v4 | Utility-first styling |
| `typescript` | ^5 | Full type safety |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier works)

### Installation

```bash
git clone <repo-url>
cd <repo-name>
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=gsk_your_key_here
```

### Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

---

## How to Use

1. **Prepare your spreadsheet** — any Excel or CSV with a header row in row 1 and data below. Columns can be anything: names, IDs, categories, locations, dates. A `sample_data.xlsx` is included in the repo root to get started quickly.

2. **Upload** — drag the file onto the upload area or click to browse.

3. **Ask questions** — type naturally. Examples:
   - *"Find Alice Johnson"*
   - *"Show me all records in category B"*
   - *"How many entries are there?"*
   - *"What details are available for ID 10045?"*

4. **Read the streamed answer** — the AI cites only what's in your data. Nothing is fabricated.

---

## Data Flow: Upload

```
File selected
   └─ Client: validate extension, build FormData
   └─ POST /api/upload
        └─ Validate: size (0 / >10MB), extension, session ID
        └─ parseExcelBuffer(buffer, fileName)
             └─ XLSX.read() — catches corrupted/password-protected
             └─ Find first non-empty sheet
             └─ sheet_to_json() with defval:null, raw:false
             └─ Normalize headers (trim, deduplicate, cap at 100)
             └─ Filter all-empty rows
             └─ Remove all-null columns
             └─ Warn if no recognizable column types
        └─ computeColumnStats() — top values per low-cardinality column
        └─ buildSearchIndex() — Fuse.js index over all rows × all keys
        └─ saveSession(sessionId, parsedData, fuseIndex)
   └─ Response: { fileName, totalRows, headers, stats, warning? }
```

## Data Flow: Chat

```
User sends message
   └─ Client: validate length, show "Searching…" phase
   └─ POST /api/chat { query, sessionId }
        └─ getSession(sessionId)
        └─ AGGREGATE_PATTERN.test(query)?
             yes → matchedRows = all rows (capped 200)
             no  → searchRows(fuse, query)
                        └─ pass 1: fuse.search(fullQuery)
                        └─ pass 2 (if 0): tokenize → per-token search
                   fallbackSearch() if still 0
                   suggestMatches() if still 0
        └─ ReadableStream:
             enqueue { type:"meta", matchedRows, suggestions? }   → client shows "Generating…"
             for await chunk of streamAnswer():
               enqueue { type:"chunk", text }                      → client appends to bubble
             enqueue { type:"done" }                               → client clears cursor
   └─ Client reads NDJSON line-by-line, updates message state
```

---

## Deployment

### Vercel (Recommended — Zero Config)

```bash
npm i -g vercel
vercel
```

Set `GROQ_API_KEY` in the Vercel dashboard under **Project → Settings → Environment Variables**.

The `app/api/chat/route.ts` uses `export const maxDuration = 60` to extend the function timeout for streaming responses. On Vercel's Hobby plan the limit is 60s; Pro plan supports up to 300s.

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add `output: "standalone"` to `next.config.ts` for the standalone build.

### Railway / Render / Fly.io

These platforms auto-detect Next.js. Set the `GROQ_API_KEY` environment variable in the dashboard and deploy from GitHub.

---

## Enhancements

These are the natural next steps for taking this reference implementation toward a production system:

### Search & Retrieval
- [ ] **Hybrid search** — combine Fuse.js score with BM25 ranking for better recall on long queries
- [ ] **Column-weighted search** — give higher Fuse.js weight to "name" and "ID" columns vs. free-text columns
- [ ] **Semantic fallback** — for queries that return 0 results after all passes, embed the query and do cosine similarity against row embeddings (e.g., using `@xenova/transformers` in-process)
- [ ] **Query expansion** — use the LLM to rewrite vague queries into multiple specific search terms before running Fuse
- [ ] **Result reranking** — send top 30 Fuse results to a cross-encoder or LLM to rerank before prompting

### Data Support
- [ ] **Multi-sheet support** — allow users to pick which sheet to index when the workbook has multiple sheets
- [ ] **Multi-file upload** — merge multiple spreadsheets into a single unified index
- [ ] **Incremental updates** — add/remove rows without re-indexing the entire dataset
- [ ] **Column type detection** — auto-detect dates, phone numbers, emails and apply type-specific formatting in answers
- [ ] **Data export** — let users download filtered subsets as CSV from query results

### AI & Prompting
- [ ] **Conversation memory** — pass last N message pairs as context to the LLM for follow-up questions
- [ ] **Function calling / tool use** — let the LLM call `search(query)` and `aggregate(column)` tools itself instead of pre-fetching rows
- [ ] **Structured output** — use `response_format: { type: "json_object" }` for queries that need tabular answers
- [ ] **Model switching** — expose a UI toggle for Groq model (LLaMA 3.1 8B for speed, 70B for quality)
- [ ] **Answer confidence** — include a confidence score based on how many rows matched and their Fuse scores

### Infrastructure
- [ ] **Persistent sessions** — replace `globalThis` store with Redis for multi-instance deployments
- [ ] **File storage** — store uploaded files in S3/R2 so sessions survive server restarts
- [ ] **Rate limiting** — add per-IP rate limiting on `/api/chat` (e.g., `@upstash/ratelimit`)
- [ ] **Authentication** — gate the upload endpoint behind an admin auth flow; keep chat public
- [ ] **Usage analytics** — log query patterns, session counts, and answer quality signals to a time-series store
- [ ] **Horizontal scaling** — with Redis sessions and S3 storage, the app becomes fully stateless

### Developer Experience
- [ ] **Test suite** — unit tests for `parseExcelBuffer`, `searchRows`, `fallbackSearch` with malformed inputs
- [ ] **E2E tests** — Playwright tests for upload → query → answer flow
- [ ] **CI pipeline** — GitHub Actions: `tsc --noEmit` + `next build` on every PR
- [ ] **Storybook** — isolated component stories for `ChatMessage`, `DbStats`, `FileUpload`

---

## Design Decisions

### Why Fuse.js instead of vector embeddings?

For structured tabular data, semantic similarity is often the wrong tool. A query for "roll number 1042" should return the row where `Roll No = 1042`, not a semantically similar value. Fuse.js gives deterministic, explainable results with zero latency and zero API cost.

Vector embeddings are better for: unstructured text corpora, semantic paraphrase matching, multilingual queries, or cases where the meaning of a query is more important than its literal tokens.

### Why NDJSON instead of SSE?

Server-Sent Events (SSE) require a special `EventSource` client API and specific `text/event-stream` formatting. NDJSON (`\n`-delimited JSON) works over a plain `fetch()` with `ReadableStream`, is trivially parseable, carries typed metadata in every line, and degrades gracefully — if the stream is interrupted, the client already has all previously received chunks.

### Why `globalThis` for session storage?

Next.js App Router runs each route handler in a separate module scope. A module-level `Map` would be re-initialized on every import. `globalThis` is shared across all modules in the same Node.js process, so the session store persists across hot-module reloads in development and across all route handlers in production.

This is appropriate for single-instance deployments. For multiple Node.js instances (horizontal scaling), replace with Redis.

### Why in-process parsing instead of a database?

For data that is read-only, query-only, and user-scoped (each user uploads their own file), there is no benefit to persisting rows in a database. Parsing into memory on upload and searching with Fuse.js is faster, simpler, and requires zero infrastructure. A 10,000-row spreadsheet takes ~50ms to parse and ~5ms to search.

---

## API Reference

### `POST /api/upload`

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | `.xlsx`, `.xls`, or `.csv`; max 10 MB |
| `sessionId` | string | UUID identifying the user's session |

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully loaded 150 records across 8 columns.",
  "data": {
    "fileName": "staff.xlsx",
    "totalRows": 150,
    "headers": ["Name", "Department", "Floor", "Room"],
    "stats": [
      { "column": "Department", "topValues": [{"value":"Engineering","count":42}], "total": 150 }
    ],
    "warning": null
  }
}
```

**Response (4xx/5xx):**
```json
{ "success": false, "error": "Human-readable error message." }
```

---

### `POST /api/chat`

**Content-Type:** `application/json`

```json
{ "query": "Where is Alice?", "sessionId": "uuid-here" }
```

**Response:** `Content-Type: application/x-ndjson` — a stream of JSON lines:

```jsonl
{"type":"meta","matchedRows":2,"suggestions":["Alice Chen","Alice Wang"]}
{"type":"chunk","text":"Based on the database, **Alice"}
{"type":"chunk","text":" Chen** is located in"}
{"type":"chunk","text":" **Room 204**, Block B, Floor 2.\n"}
{"type":"done"}
```

On error:
```jsonl
{"type":"error","message":"The AI service is rate-limited. Please wait a few seconds."}
```

---

### `DELETE /api/session?sessionId=<uuid>`

Removes the session and its in-memory index. Returns `204 No Content`.

---

## License

MIT
