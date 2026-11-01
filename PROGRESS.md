# Progress

Last updated: 2026-11-01

## Done
- Live at idealaunchpad.netlify.app (Netlify, from main). Database: Neon Postgres.
- Password login, quick capture (tags, project, priority, effort, next step), list with search and filters, archive with outcomes, board view, tiki theme, how-to box.
- Start (project setup package, copies the interview prompt, opens the project), Continue (reopens a saved chat link, or copies a stage-based resume prompt), Open project button.
- MCP connector at /api/mcp with OAuth sign-in. Tools: list_ideas, get_idea, add_brief, add_note, set_status, set_effort_and_priority, suggest_next. Connected on web and phone.
- Start-to-brief test passed (photo culling idea): brief and effort estimate saved. Checked 2026-10-29.
- Continue tested on the live site: copies a good resume prompt when there is no chat link. Checked 2026-10-29.
- Prototype review finished. Agreed changes: accept Claude Code project links, add Continue to the how-to box, stack the filter dropdowns on narrow phones. Board, Ask tab and photo strip stay as drawn.
- Prototype updated to accept Claude Code links (version 2).
- Those three changes built on branch feature/code-links-howto-filters. Typecheck and build pass. Draft PR #15 open. Not yet checked on a real phone.

## In progress
- PR #15 waiting on Chris to try it and say yes to merge. No database changes in it.

## Open branches

| Branch | State | Notes |
|---|---|---|
| feature/code-links-howto-filters (PR #15) | Draft PR | Code links, Continue in how-to, stacked filters. Merging puts it live via Netlify. |
| feature/mission-control (PR #8) | Draft PR | Adds Mission Control. Its migration runs on the live database when merged, so ask before merging. |
| claude/idea-launchpad-phone-app-duspw2 | Unknown | Older working branch. Check whether it can be deleted. |
| progress/2026-10-29 | This file | Progress notes only. |

## Next 3 steps
1. Try PR #15 on a phone (Netlify preview link if shown), then decide on merge (needs Chris).
2. Limit password guesses on login and sign-in. Write the short user guide.
3. Step 7: photo attachments in Google Drive, one folder per idea (needs Chris to do the Google Cloud setup).

## Decisions
- Interviews happen in Claude, not inside the app. Claude projects are created by hand.
- Effort is estimated by Claude during interviews or on request, not by the app on save.
- No offline capture, no email or text capture for now.
- Claude Code project links (claude.ai/code/project/…) are accepted the same as regular project links.
- Project links must start with https://. Artifact links (claude.ai/artifact/…) are not project links.
