# Agent Quickstart

If you hand a new coding agent only two docs, hand this page and [/game-spec-template](/game-spec-template).

## What Puzzlebox Already Gives You

- tenant-scoped requests,
- game/edition/round/session primitives,
- server-side answer validation by mode,
- idempotent session start and resume payloads,
- streak + share payloads at completion,
- analytics endpoints,
- TypeScript SDK aligned to OpenAPI.

Do not add new primitives until the game clearly cannot fit `pick_one`, `ordered_sequence`, or `survey`.

## Runtime Rules (Do Not Violate)

- External JSON is `snake_case`.
- Tenant context is always `X-Tenant`.
- Admin routes require `X-API-Key`.
- Gameplay routes require a player bearer token.
- Frontend bootstraps from `GET /api/v1/games/{slug}/today`.
- `POST /api/v1/sessions` may return `session_exists`; resume instead of failing.
- `POST /api/v1/sessions/{id}/respond` returns `session_completed` when already finalized.
- `POST /api/v1/sessions/{id}/complete` returns `session_incomplete` until every round has a response.
- `ordered_sequence` answers must contain every option key exactly once.
- Storage backend is explicit per environment: `memory` for local throwaway loops, `postgres` for durable environments.

## Object Model

```text
Tenant -> Game -> Edition -> Round
Player -> Session -> Response
```

## Mode Selection

| Game idea | Mode | Notes |
|---|---|---|
| Trivia, quote match, location pick | `pick_one` | One point for correct answer |
| Timeline, ranking, chronology | `ordered_sequence` | Supports partial credit per position |
| Opinion/poll/crowd language | `survey` | No correct answer, returns distribution |

## Minimum Build Workflow

1. Fill [/game-spec-template](/game-spec-template).
2. Create game + one edition for today.
3. Build frontend loop:
   - `GET /api/v1/games/{slug}/today`
   - `POST /api/v1/sessions`
   - `POST /api/v1/sessions/{id}/respond`
   - `POST /api/v1/sessions/{id}/complete`
4. Confirm refresh resumes in-progress sessions.
5. Add one integration test covering create game -> create edition -> play -> complete.
6. Leave short docs for the next agent.

## Definition Of Done

- Game setup is scriptable via API or SDK.
- Today has a real `active` edition payload.
- Frontend completes a full session and renders `share_data`.
- Resume path works on refresh and duplicate start attempts.
- Tests cover happy path plus one guardrail case.
- Next-edition publishing flow is documented.

## Copy/Paste Prompt

```text
Use Puzzlebox primitives unless the current framework clearly cannot express the game.

Before coding, read:
1. /agent-quickstart
2. /game-spec-template
3. /quickstart
4. /storage
5. /sdk
6. /api/overview

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
- do not create new backend primitives if `pick_one`, `ordered_sequence`, or `survey` already fits,
- call out the intended storage backend (`memory` for throwaway local tests, `postgres` for durable state).
```

## Example Handoffs In This Repo

If you want concrete examples of how specific game briefs get translated for another agent, read:

- `docs/Drift-Playtest-Agent-Handoff.md`
- `docs/Heatmap-Playtest-Agent-Handoff.md`
