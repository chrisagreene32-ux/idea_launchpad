# Idea Launchpad

Phone-first app for Chris and Kat: capture ideas, then run projects through Mission Control (`/mission`): numbered chat chain, baton, handoffs, what to do next.

The shared rules in github.com/chrisagreene32-ux/claude-projects (CLAUDE.md) apply here too. Cloud sessions can't see that repo, so the essentials are copied below.

## Rules
- Update `PROGRESS.md` at the end of every session, before stopping, on the PR branch (never straight to main). Keep its sections current: done, in progress, open branches, next 3 steps.
- Every recap ends with a short "Saving usage" note: the next 3 steps in a sensible order (say which need the user) and one way to cut token use.
- Plain language. Outcome first, no jargon.
- Think before coding, keep it simple, make surgical changes, and turn tasks into checks you can verify.
- No real client, therapist, or other health data in this app. Project handoffs describe work, not people.
- Don't push to main, merge, or deploy without approval. Netlify runs `prisma migrate deploy` on build, so a migration reaches the live database when a build runs.

## Checks before pushing
`npm run typecheck && npm run build`
