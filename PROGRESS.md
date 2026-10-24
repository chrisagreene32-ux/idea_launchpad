# Progress

Last updated: 2026-10-24

## Done
- Capture, tags, priority and effort, archive with outcomes, Start button, Claude connector (steps 1-6, merged to main)
- Mission Control built on a branch: projects, numbered sessions, baton, handoffs, do-this-next, six connector tools
- Starter project "Roost" renamed to MysApp (code MYSAPP)
- Chat names now read `SCHED-014 · Code · goal · K`; chain shows dates; start_session says which chat it continues

## In progress
- Mission Control is not yet verified. The authoring sandbox could not generate the Prisma client, so typecheck and build have not run.

## Open branches

| Branch | State | Notes |
|---|---|---|
| feature/mission-control | Pushed, unreviewed | Adds migration 20261024000000_mission_control (new tables only) |

## Next 3 steps

1. Run `npm install && npm run typecheck && npm run build` locally or via Netlify preview and fix anything it finds (needs a person).
2. Switch the Netlify production branch to main, then merge Mission Control and load the starter projects at /mission (needs a person).
3. Re-add the connector so the new tools show up, then try the pickup and wrap-up prompts on one real project.
