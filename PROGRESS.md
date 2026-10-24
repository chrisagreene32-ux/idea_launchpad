# Progress

Last updated: 2026-10-24

## Done
- Capture, tags, priority and effort, archive with outcomes, Start button, Claude connector (steps 1-6, merged to main)
- Mission Control built on a branch: projects, numbered sessions, baton, handoffs, do-this-next, six connector tools
- Starter project "Roost" renamed to MysApp (code MYSAPP)
- Chat names now read `SCHED-014 · Code · goal · K`; chain shows dates; start_session says which chat it continues
- Start prompt per logged session opens with a chat-title line, so a new chat gets its name automatically (title trick found by Chris)
- LAUNCH-001: Mission Control verified. Typecheck and build pass after one small type fix on /mission. Migration matches the schema exactly. Draft PR #8 opened into main.
- Connector gained add_project and add_idea (so a mid-chat /mission-log skill can save new projects and ideas). Typecheck and build pass; fields match the schema.

## In progress
- Mission Control is waiting on review and merge (draft PR #8). Not yet tried in a browser.

## Open branches

| Branch | State | Notes |
|---|---|---|
| feature/mission-control | Draft PR #8, typecheck + build pass | Adds migration 20261024000000_mission_control (new tables only, checked against schema) |

## Next 3 steps

1. Open the Netlify preview for PR #8 and click through /mission (needs a person).
2. Switch the Netlify production branch to main, then mark PR #8 ready and merge it, and load the starter projects at /mission (needs a person).
3. Re-add the connector so the new tools show up, then try the pickup and wrap-up prompts on one real project (needs a person).
