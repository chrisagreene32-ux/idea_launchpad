# Idea Launchpad

Phone-first app to capture ideas in seconds and turn them into Claude projects.

## Setup
1. Create a Neon project (separate from any other prototype). Copy the pooled string to `DATABASE_URL` and the direct string to `DIRECT_URL`.
2. Create a Netlify site from this repo and add both variables under Site configuration → Environment variables.
3. Locally: copy `.env.example` to `.env`, fill it in, then `npx prisma migrate deploy` and `npm run dev`.

Checks before pushing: `npm run typecheck && npm run build`.

## Claude connector (MCP)
The app hosts a remote MCP server at `https://YOUR-SITE/api/mcp`. In Claude on the web, go to Settings → Connectors → Add custom connector and enter that address. Claude opens a sign-in page on your site; enter the app password. Tools: `list_ideas`, `get_idea`, `add_brief`, `add_note`, `set_status`, `set_effort_and_priority`, `suggest_next`.

Sign-in is OAuth 2.1 with PKCE. Access tokens last 1 hour and are signed with `SESSION_SECRET`; refresh tokens last 90 days and are stored hashed. Changing `SESSION_SECRET` or `APP_PASSWORD` signs everything out.
