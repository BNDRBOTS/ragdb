# RAG Chat

Chat with your documents. Upload PDFs, Word docs, spreadsheets, or plain text — the app chunks, embeds, and indexes them in Postgres. Every message performs a live similarity search against your documents and injects the relevant context into the model before answering.

Multi-tenant, fully isolated by user at the database layer. Built on Next.js 15 App Router + Supabase + DeepSeek.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Database | Supabase Postgres (pgvector, HNSW index) |
| Auth | Supabase Auth (email/password) |
| File storage | Supabase Storage |
| Embeddings | OpenAI `text-embedding-3-small` (1536-dim) |
| Chat model | DeepSeek `deepseek-reasoner` (streaming, with thinking trace) |
| PDF parsing | unpdf (serverless-safe, no native deps) |
| Language | TypeScript, strict mode |
| Styles | Tailwind CSS v3 |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the **pgvector extension available** (enabled in the migration — no manual step required on paid plans; free tier includes it)
- An [OpenAI](https://platform.openai.com) API key (embeddings only — `text-embedding-3-small`)
- A [DeepSeek](https://platform.deepseek.com) API key

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in all five values before running locally. For Railway, set these in the service's **Variables** panel.

```
NEXT_PUBLIC_SUPABASE_URL       # https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  # public anon key — safe for client bundles
SUPABASE_SERVICE_ROLE_KEY      # service role key — server only, bypasses RLS
OPENAI_API_KEY                 # used only for embedding, never sent to client
DEEPSEEK_API_KEY               # used only for chat, never sent to client
```

The service role key is used **only** for trusted server-side writes (persisting chat messages and document chunks after auth is confirmed). All reads — including vector similarity search — run under the user's own JWT so RLS is enforced at the query level.

---

## Database setup

Run the three migrations in order against your Supabase project. The fastest path is the Supabase SQL editor (Dashboard → SQL Editor → New query).

**001_initial.sql** — Core schema: `documents`, `document_chunks`, `chat_sessions`, `chat_messages` tables. Enables pgvector, creates the HNSW cosine-distance index on `document_chunks.embedding`, and sets RLS policies on all tables.

**002_storage.sql** — Creates the private `rag-documents` storage bucket (50 MB file limit) and RLS policies that scope every storage operation to the uploading user's folder.

**003_match_chunks.sql** — Creates the `match_chunks` RPC used for similarity retrieval. Defined as `SECURITY INVOKER` so it executes under the caller's JWT — RLS applies to every row it touches. No user ID is accepted as a parameter; isolation is structural, not caller-supplied.

All three files are in `supabase/migrations/`. Run them once, in order, before first use. Rerunning is safe (`CREATE OR REPLACE` / `ON CONFLICT DO NOTHING` throughout).

---

## Local development

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, upload a document, start a chat.

Type checking:

```bash
npm run type-check
```

---

## Deploying to Railway

1. Push the repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** → select this repo.
3. Railway auto-detects Next.js and sets the build command (`npm run build`) and start command (`npm start`).
4. Add the five environment variables in the service's **Variables** tab.
5. Deploy. No `nixpacks.toml` or additional config required.

The two heavy server routes (`/api/chat/stream` and `/api/documents/upload`) are set to `runtime = 'nodejs'` and `maxDuration = 300` seconds, which covers large file uploads and long streaming responses. Railway's default plan supports this without changes.

The lockfile (`package-lock.json`) is committed, so Railway runs `npm ci` for a deterministic install.

---

## How it works

### Document ingestion

1. User uploads a file (PDF / DOCX / XLSX / TXT / Markdown, max 50 MB).
2. Server extracts raw text via the appropriate parser (`unpdf`, `mammoth`, `xlsx`, or direct read).
3. Text is split into overlapping chunks (512 tokens max, 64-token overlap) using a sentence-boundary chunker.
4. All chunks are embedded in a single batched call to OpenAI `text-embedding-3-small`.
5. Chunks and embeddings are inserted into `document_chunks`. The document row is updated to `status: 'ready'`.

### Chat

1. User sends a message. The stream route receives `session_id` and `message`.
2. The user's message is persisted, then up to 20 prior turns are fetched to build conversation history.
3. The query is embedded and `match_chunks` is called via the user-scoped client — RLS filters results to the current user's chunks only. The HNSW index is used for the distance scan; `ef_search = 100` prevents recall degradation in multi-tenant data.
4. Up to 8 chunks above a 0.3 cosine similarity threshold are injected into the system prompt as numbered source excerpts.
5. The full message history (system + prior turns + current message) is sent to DeepSeek `deepseek-reasoner` as a streaming request.
6. Thinking tokens stream as `event: thinking`, content tokens as `event: content`. The terminal `event: done` carries source chunk metadata and triggers the client to commit the assistant message to state.
7. The assistant message (content, thinking trace, source chunks) is persisted to `chat_messages` via the service client.

### Security boundary

| Operation | Client used | Why |
|---|---|---|
| Reads (messages, sessions, documents, vector search) | User-scoped client (anon key + JWT cookie) | RLS enforced at the query |
| Writes (insert messages, insert chunks, update document status) | Service role client | Runs after response starts streaming — cookie writes are unsafe at that point |

The service role is never used for reads. The `match_chunks` RPC accepts no `user_id` parameter — isolation is enforced by `WHERE user_id = auth.uid()` inside the function body, not by the caller.

---

## Accepted file types

| Format | Extension | Parser |
|---|---|---|
| PDF | `.pdf` | unpdf |
| Word | `.docx` | mammoth |
| Excel | `.xlsx` | xlsx |
| Plain text | `.txt` | direct |
| Markdown | `.md` | direct |

Maximum file size: **50 MB** (enforced at both the API route and the storage bucket).

---

## Tuning

All tunable constants are co-located with the code that uses them — no separate config file.

| Constant | Location | Default | Effect |
|---|---|---|---|
| `MAX_FILE_SIZE` | `upload/route.ts` | 50 MB | Hard cap on upload size |
| `maxTokens` | `upload/route.ts` → `chunkText()` | 512 | Max tokens per chunk |
| `overlapTokens` | `upload/route.ts` → `chunkText()` | 64 | Context overlap between chunks |
| `topK` | `lib/retriever.ts` | 8 | Chunks retrieved per query |
| `matchThreshold` | `lib/retriever.ts` | 0.3 | Min cosine similarity (0–1) |
| `HISTORY_LIMIT` | `stream/route.ts` | 20 | Prior turns sent to the model |
| `hnsw.ef_search` | `003_match_chunks.sql` | 100 | HNSW recall depth |

---

## Project structure

```
app/
  (auth)/auth/         Sign-in, sign-up, auth callback
  (chat)/
    layout.tsx         Sidebar layout wrapper (all chat routes)
    chat/page.tsx      Chat: auto-creates or loads most recent session
    chat/[id]/page.tsx Chat: specific session
    documents/page.tsx Document library
  api/
    auth/callback/     Supabase OAuth/magic-link redirect handler
    chat/stream/       SSE stream route — retrieval + DeepSeek
    documents/upload/  Ingest pipeline
    documents/delete/  Remove document + its chunks + storage object
components/            UI components
hooks/                 useChat, useConversations, useDocuments
lib/
  chunker.ts           Sentence-boundary sliding-window chunker
  embed.ts             OpenAI embedding (single + batch)
  pipeline.ts          Retrieval → system prompt assembly
  retriever.ts         match_chunks RPC wrapper
  parsers/             pdf, docx, xlsx, txt
  deepseek/client.ts   Streaming DeepSeek wrapper
  supabase/            server.ts (service role), client.ts (browser)
supabase/migrations/   001 schema, 002 storage, 003 match_chunks RPC
types/
  database.ts          Generated-style Supabase type bindings
  index.ts             Shared application types
```
