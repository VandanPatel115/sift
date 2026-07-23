# Development Log

## Day 1 — 2026-07-20
**Hours worked:** [fill in your actual hours]
**What I did:** Scaffolded Next.js 15 + TypeScript + Tailwind + shadcn (Base UI, Nova
style). Designed the full Prisma schema (8 models), enabled pgvector on Neon via the
postgresqlExtensions preview feature so it's part of tracked migration history. Set up
Auth.js with credentials + Google OAuth. Set up GitHub Actions CI. Added LICENSE,
CONTRIBUTING, CHANGELOG.
**What I learned:** Prisma 7 changed datasource config significantly — downgraded to
Prisma 6 for stability. pgvector has to be declared via postgresqlExtensions in the
schema itself, not created manually in the SQL editor, or `migrate reset` silently
wipes it since it drops the whole public schema. Anthropic/OpenAI have no free API
tier — switched runtime AI to Google's Gemini API instead.
**Blockers:** None currently.
**Plan for tomorrow:** Document upload pipeline — Vercel Blob storage, PDF text
extraction, chunking, and Gemini embeddings.


## Day 2 — 2026-07-21
**Hours worked:** [fill in]
**What I did:** Built the full ingestion pipeline — PDF extraction (unpdf), chunking,
Gemini embeddings (gemini-embedding-001 truncated to 1536 dims). Set up Vercel Blob
for storage. Discovered the auth flow was incomplete from Day 1 — added the missing
Auth.js route handler, a credentials signup endpoint that also provisions a starter
workspace, plain signup/login pages, and a real dashboard page. Verified end to end:
signed up, landed on the dashboard, uploaded a real PDF, watched it go
processing → ready, and confirmed actual embedded chunks in Neon directly via SQL
rather than trusting the UI status alone.
**What I learned:** Wiring Auth.js's config isn't enough on its own — it needs the
[...nextauth] catch-all route handler to actually respond to requests, and a
Credentials provider only verifies logins, it doesn't create accounts, so a separate
signup endpoint was required. Worth checking data at the source (SQL) rather than
trusting a status badge in the UI.
**Blockers:** None currently.
**Plan for tomorrow:** Vector retrieval and the RAG chat core — the actual product.


## Day 3 — 2026-07-22
**Hours worked:** [fill in]
**What I did:** Built vector retrieval via pgvector's cosine distance operator, and
the full RAG chat route — retrieve top-6 chunks, build numbered context, stream a
Gemini-generated answer, save both messages with citation metadata. Built the chat
UI with streaming bubbles and citation chips, plus real error handling (was
originally missing — failed requests left an empty bubble with no feedback).
**What I learned:** Model availability on Gemini's free tier is genuinely volatile
right now — gemini-2.5-flash 404s for new API keys (deprecated ahead of its official
shutdown date), and gemini-3.5-flash, despite being the current GA flagship, was
returning sustained 503s for free-tier keys during its post-launch capacity ramp-up.
Added retry-with-backoff for transient errors, but ultimately had to query my own
key's live model list and test candidates directly against the API rather than
trust documentation, which lags real availability. Landed on gemini-3.1-flash-lite.
Verified end to end: real question asked, real cited answer generated, confirmed
the message rows in Neon directly rather than trusting the UI alone.
**Blockers:** None now — resolved.
**Plan for tomorrow:** Workspace roles/permissions (RBAC), the dashboard's document
list and search, and audit logging.


## Day 4 — 2026-07-23
**Hours worked:** [fill in]
**What I did:** Built server-side RBAC with a role hierarchy (viewer < member < admin
< owner), enforced on upload (member+) and delete (admin+), never trusting a role
sent from the client. Added audit logging on both mutations. Built document search,
soft-delete with a confirm step, and a 14-day usage chart showing daily query volume.
**What I learned:** Postgres full-text search (tsvector) treats underscores as part
of a word, not a separator — searching "CV" against "CV_VandanKunalPatel.pdf" failed
because the whole filename tokenized as one lexeme. Switched to ILIKE substring
matching, which is the right tool for filename search versus full-text search's
actual use case (matching words within prose). Also caught myself pasting code into
the wrong file twice tonight (route.ts vs [id]/route.ts) — now always verifying with
cat before assuming a paste landed correctly.
**Blockers:** None.
**Plan for tomorrow:** Polish pass — loading/empty/error states across every screen,
Cmd+K command palette, toasts, accessibility, and real tests.