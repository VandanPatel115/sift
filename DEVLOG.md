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