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