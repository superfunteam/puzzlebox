# Architecture

Puzzlebox is intentionally narrow: reusable backend primitives for daily-play games.

## Core Surfaces

- `apps/api`: tenant-scoped Hono API with OpenAPI docs.
- `packages/shared`: shared enums, types, and rule helpers.
- `packages/sdk`: typed TypeScript client for gameplay and admin flows.
- `apps/web`: reference game shell showing the intended client loop.
- `tools/sheets-sync`: content ingestion path for editorial operations.
- `apps/docs`: the docs site and agent handoff surface.
- `packages/db`: Postgres schema + migrations source of truth.

## Stable Runtime Model

```text
Tenant -> Game -> Edition -> Round
Player -> Session -> Response
```

That is the backbone of the framework. Most new games should fit without changing it.

## Storage Runtime Note

The API supports two backends with the same external contract:

- `memory`: fast throwaway prototyping (restart resets runtime state).
- `postgres`: durable runtime (Supabase-hosted, Supabase self-hosted, or any Postgres).

Backend selection is environment-driven:

- `DATABASE_URL` present -> defaults to `postgres`.
- `DATABASE_URL` absent -> defaults to `memory`.
- `STORAGE_BACKEND` can explicitly force either mode.

## What Changes Per Game

- visual design,
- frontend interaction patterns,
- round prompts/options/metadata,
- reveal copy,
- edition creation workflow.

## What Should Not Change Per Game

- session lifecycle,
- tenant scoping,
- streak updates,
- share payload generation,
- analytics endpoint structure,
- the `today -> start/resume -> respond -> complete` loop.

## Contract Conventions

- External API JSON is `snake_case`.
- Internal TypeScript models are `camelCase`.
- The API layer normalizes between the two.
- The OpenAPI document at `/doc` is the contract snapshot agents should trust.

## Playability Rules

- A frontend should bootstrap with `GET /api/v1/games/{slug}/today`.
- If `existing_session` is present, resume it.
- `POST /api/v1/sessions` is idempotent and may return `session_exists`.
- Sessions can only start for `active` editions.
- `POST /api/v1/sessions/{id}/respond` returns `session_completed` if the session is finalized.
- `POST /api/v1/sessions/{id}/complete` returns `session_incomplete` until all rounds are answered.
- `ordered_sequence` with partial credit derives `max_score` from sequence length, not just round count.

## Why This Matters For Agents

An agent works best when:

- the object model is explicit,
- the API responses are consistent,
- the happy path and resume path are both documented,
- the docs tell it what not to invent.

That is the design standard for Puzzlebox. If a change makes the framework more flexible but less legible to a fresh agent, it is usually the wrong change.
