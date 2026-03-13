# Puzzlebox

Puzzlebox is an agent-first backend baseline for daily-play games.

It gives you stable primitives (`game`, `edition`, `round`, `session`) so new games become content + frontend work instead of custom backend plumbing every time.

## Start Here (Agent Handoff)

1. `apps/docs/docs/agent-quickstart.md`
2. `apps/docs/docs/game-spec-template.md`
3. `apps/docs/docs/quickstart.md`
4. `apps/docs/docs/storage.md`

Example handoffs:

- `docs/Drift-Playtest-Agent-Handoff.md`
- `docs/Heatmap-Playtest-Agent-Handoff.md`

## Core Guarantees

- tenant-scoped API via `X-Tenant`
- external `snake_case` JSON contract
- mode-based server validation (`pick_one`, `ordered_sequence`, `survey`)
- idempotent session start with resume payloads
- streak/share payload on completion
- typed SDK + generated OpenAPI

## Storage Modes

Puzzlebox supports two runtime backends with the same external API contract:

- `memory`: fastest local prototyping loop; restarting the API resets runtime data.
- `postgres`: durable runtime state for production/self-hosted deployments.

Backend selection:

- If `DATABASE_URL` is set, backend defaults to `postgres`.
- If `DATABASE_URL` is not set, backend defaults to `memory`.
- `STORAGE_BACKEND` can explicitly override either mode.

## Quick Local Boot

```bash
cp .env.example .env
npm install
npm run db:push
npm run build
npm run start -w @puzzlebox/api
```

If you want a throwaway in-memory run instead, set `STORAGE_BACKEND=memory` in `.env` and skip DB migration commands.

To run API tests against a real local Postgres container:

```bash
npm run test:api:postgres
```

Useful URLs:

- OpenAPI JSON: `http://localhost:3000/doc`
- Interactive API docs: `http://localhost:3000/reference`
- Docs site: `npm run docs:dev`

## Repository Layout

- `apps/api`: Hono API implementation
- `apps/web`: reference frontend loop
- `apps/docs`: landing page and agent docs
- `packages/shared`: shared enums/types/helpers
- `packages/sdk`: typed TypeScript client
- `packages/db`: Postgres schema + migration source of truth
- `tools/sheets-sync`: editorial ingestion helper

## Contract Snapshot

```bash
npm run openapi:baseline
```

This regenerates `openapi.baseline.json` from the current API routes and schemas.
