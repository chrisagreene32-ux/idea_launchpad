# Idea Launchpad

Phone-first app to capture ideas in seconds and turn them into Claude projects.

## Setup
1. Create a Neon project (separate from any other prototype). Copy the pooled string to `DATABASE_URL` and the direct string to `DIRECT_URL`.
2. Create a Netlify site from this repo and add both variables under Site configuration → Environment variables.
3. Locally: copy `.env.example` to `.env`, fill it in, then `npx prisma migrate deploy` and `npm run dev`.

Checks before pushing: `npm run typecheck && npm run build`.
