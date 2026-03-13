# Agent Quickstart

If you only hand a new coding agent two docs, hand it this page and [/game-spec-template](/game-spec-template).

## What Puzzlebox Is

Puzzlebox is the reusable backend layer for daily-play games. It already knows how to:

- scope every request to a tenant,
- define a game and its runtime policy,
- publish daily editions made of ordered rounds,
- validate answers server-side,
- resume or reject duplicate sessions,
- calculate streaks and share payloads,
- expose analytics for games and editions.

Do not invent new backend entities until you have proven that the game idea does not fit the existing model.

## External API Rules

- External JSON is `snake_case`.
- Tenant context is always the `X-Tenant` header.
- Admin routes use `X-API-Key`.
- Gameplay routes use a player bearer token.
- `GET /games/{slug}/today` is the frontend bootstrap request.
- Sessions are one attempt per player per edition.
- `POST /sessions` can return `session_exists` with a full resumable session payload.
- Sessions can only start for `active` editions.

## Puzzlebox Object Model

### Tenant

One newsroom or publisher deployment. Tenancy is a runtime boundary, not a UI concept.

### Game

Defines the stable rules of a title:

- `mode`
- `lifecycle`
- `config`

This should change rarely.

### Edition

One day’s playable content for one game on one date.

### Round

One prompt inside an edition. Rounds are ordered and validated on the server.

### Session

One player’s attempt at one edition. Responses are attached to the session and are idempotent per round.

## Pick The Right Mode

| Game idea | Mode | Notes |
|---|---|---|
| Trivia, quote matching, geography pickers | `pick_one` | One point per round. Best default when answers are discrete. |
| Timelines, ranking, chronology, ordering | `ordered_sequence` | Partial credit is built in. Max score comes from the number of positions when partial credit is enabled. |
| Polls, “what do you call this?”, audience preference | `survey` | No correct answer. The response returns crowd distribution. |

## Minimum Build Workflow

1. Turn the game idea into the spec on [/game-spec-template](/game-spec-template).
2. Create the game and one working edition first.
3. Build the frontend around `GET /games/{slug}/today`, `POST /sessions`, `POST /respond`, and `POST /complete`.
4. Verify session resume and refresh behavior.
5. Add one happy-path test covering create game -> create edition -> play -> complete.
6. Leave concise docs for the next agent.

## Definition Of Done

- The game can be created through the API or SDK.
- A real edition payload exists for today.
- The frontend plays through a complete session.
- Refreshing the page resumes an in-progress session instead of failing.
- The final screen uses `share_data`.
- Tests cover the primary loop.
- Docs explain how to add the next edition and where content lives.

## Recommended Worktree Split

If you want multiple agents in parallel, split by vertical surface, not by arbitrary files:

1. Agent A: admin/content flow and API tests.
2. Agent B: playable frontend and session resume UX.
3. Agent C: docs, examples, and landing-page explanation.

Keep each worktree responsible for one coherent slice.

## Copy-Paste Prompt

```text
Use Puzzlebox primitives unless the current framework clearly cannot express the game.

Before coding, read:
1. /agent-quickstart
2. /game-spec-template
3. /quickstart
4. /sdk
5. /api/overview

Goal: build a working daily game from the spec below.

Required output:
- game setup flow,
- one playable frontend,
- tests for the happy path,
- concise implementation docs for the next agent.

Constraints:
- keep the external API contract in snake_case,
- prefer the SDK for client code,
- support session resume,
- do not create new backend primitives if `pick_one`, `ordered_sequence`, or `survey` already fits.
```

## Example Handoffs In This Repo

If you want concrete examples of how specific game briefs get translated for another agent, read:

- `docs/Drift-Playtest-Agent-Handoff.md`
- `docs/Heatmap-Playtest-Agent-Handoff.md`
