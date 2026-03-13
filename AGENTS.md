# Puzzlebox Agent Instructions

Use this file when a new coding agent joins this repo.

## Read First

1. `apps/docs/docs/agent-quickstart.md`
2. `apps/docs/docs/game-spec-template.md`
3. `apps/docs/docs/quickstart.md`
4. `apps/docs/docs/sdk.md`
5. `apps/docs/docs/storage.md`

## Non-Negotiable Contract Rules

- External API JSON is `snake_case`.
- Every API request includes `X-Tenant`.
- Admin routes require `X-API-Key`.
- Gameplay routes require player bearer JWT.
- Frontend bootstrap starts at `GET /api/v1/games/{slug}/today`.
- Session start is idempotent (`session_exists` means resume).
- `ordered_sequence` answers must include every option key exactly once.

## Runtime Scope

- Storage backend is explicit: `memory` or `postgres`.
- `DATABASE_URL` defaults runtime to `postgres`; without it, runtime defaults to `memory`.
- `memory` is for fast local agent prototyping (API restart resets runtime state).
- `postgres` is for durable state (Supabase-hosted, Supabase self-hosted, or any Postgres).
- Keep backend assumptions explicit in docs and implementation notes.

## Build Expectations

- Prefer existing primitives over creating new backend entities.
- Keep `apps/docs` and API behavior synchronized.
- Add or update tests for any behavior change.
- Regenerate `openapi.baseline.json` when route/schema contracts change.
