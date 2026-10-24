# Idea Launchpad

Phone-first app to capture ideas in seconds and turn them into Claude projects.

## Setup
1. Create a Neon project (separate from any other prototype). Copy the pooled string to `DATABASE_URL` and the direct string to `DIRECT_URL`.
2. Create a Netlify site from this repo and add both variables under Site configuration → Environment variables.
3. Locally: copy `.env.example` to `.env`, fill it in, then `npx prisma migrate deploy` and `npm run dev`.

Checks before pushing: `npm run typecheck && npm run build`.

## Claude connector (MCP)
The app hosts a remote MCP server at `https://YOUR-SITE/api/mcp`. In Claude on the web, go to Settings → Connectors → Add custom connector and enter that address. Claude opens a sign-in page on your site; enter the app password. Tools: `list_ideas`, `get_idea`, `add_brief`, `add_note`, `set_status`, `set_effort_and_priority`, `suggest_next`, plus Mission Control: `list_projects`, `get_project`, `start_session`, `log_handoff`, `set_baton`, `mission_next`.

Sign-in is OAuth 2.1 with PKCE. Access tokens last 1 hour and are signed with `SESSION_SECRET`; refresh tokens last 90 days and are stored hashed. Changing `SESSION_SECRET` or `APP_PASSWORD` signs everything out.

## Mission Control
`/mission` tracks projects, a numbered chain of Claude chats and Code sessions per project, who holds the baton (Chris or Kat), deadlines, and handoffs. It recommends what to do next. Chats are named `SCHED-014 · Code · finish team activities · K` (project code and padded number, Chat or Code, a verb-first goal, driver initial; start the goal with `phase 2:` to mark a new phase). Each project page has copy-ready pickup and wrap-up prompts; with the connector added, Claude can log sessions and handoffs itself. Keep real client or therapist data out of it.
