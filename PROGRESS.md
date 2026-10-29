# Progress

Last updated: 2026-10-29

## Done
- Live at idealaunchpad.netlify.app (Netlify, from main). Database: Neon Postgres.
- Password login, quick capture (tags, project, priority, effort, next step), list with search and filters, archive with outcomes, board view, tiki theme, how-to box.
- Start (project setup package, copies the interview prompt, opens the project), Continue (reopens a saved chat link, or copies a stage-based resume prompt), Open project button.
- MCP connector at /api/mcp with OAuth sign-in. Tools: list_ideas, get_idea, add_brief, add_note, set_status, set_effort_and_priority, suggest_next. Connected on web and phone.
- Start-to-brief test passed (photo culling idea): brief and effort estimate saved. Checked 2026-10-29.
- Continue tested on the live site: copies a good resume prompt when there is no chat link. Checked 2026-10-29.

## In progress
- Prototype review (https://claude.ai/artifact/QXvrcSg38gu6HSw5ccbQHx): agree on changes there before changing the real app.

## Open branches

| Branch | State | Notes |
|---|---|---|
| feature/mission-control (PR #8) | Draft PR | Adds Mission Control. Its migration runs on the live database when merged, so ask before merging. |
| claude/idea-launchpad-phone-app-duspw2 | Unknown | Older working branch. Check whether it can be deleted. |
| progress/2026-10-29 | This file | Progress notes only. |

## Next 3 steps
1. Review the prototype together and agree on changes (needs Chris).
2. Small fixes: add Continue to the how-to box, fix filter dropdowns cut off on narrow phones, limit password guesses on login and sign-in.
3. Step 7: photo attachments in Google Drive (needs Chris to do the Google Cloud setup). Write the short user guide when convenient.

## Decisions
- Interviews happen in Claude, not inside the app. Claude projects are created by hand.
- Effort is estimated by Claude during interviews or on request, not by the app on save.
- No offline capture, no email or text capture for now.
