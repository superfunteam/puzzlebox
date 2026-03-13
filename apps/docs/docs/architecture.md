# Architecture

Puzzlebox is intentionally narrow: it is the reusable backend layer for daily-play games.

## Core Surfaces

- `apps/api`: tenant-scoped Hono API with OpenAPI docs.
- `packages/shared`: shared enums, types, and rule helpers.
- `packages/sdk`: typed TypeScript client for gameplay and admin flows.
- `apps/web`: reference game shell showing the intended client loop.
- `tools/sheets-sync`: content ingestion path for editorial operations.
- `apps/docs`: the docs site and agent handoff surface.

## Stable Runtime Model

```text
Tenant -> Game -> Edition -> Round
Player -> Session -> Response
```

That is the backbone of the framework. Most new games should fit without changing it.

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

- A frontend should bootstrap with `GET /games/{slug}/today`.
- If `existing_session` is present, resume it.
- `POST /sessions` is idempotent and may return `session_exists`.
- Sessions can only start for `active` editions.
- `ordered_sequence` with partial credit derives `max_score` from sequence length, not just round count.

## Why This Matters For Agents

An agent works best when:

- the object model is explicit,
- the API responses are consistent,
- the happy path and resume path are both documented,
- the docs tell it what not to invent.

That is the design standard for Puzzlebox. If a change makes the framework more flexible but less legible to a fresh agent, it is usually the wrong change.
