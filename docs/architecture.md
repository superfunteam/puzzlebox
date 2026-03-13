# Architecture

Source of truth architecture lives in [`apps/docs/docs/architecture.md`](../apps/docs/docs/architecture.md).

Short version:

- API contract is OpenAPI-first and `snake_case` externally.
- Runtime model is `Tenant -> Game -> Edition -> Round` and `Player -> Session -> Response`.
- Storage backend is `memory` (prototype) or `postgres` (durable) with identical API contract.
- `packages/db` is the schema and migration source of truth for Postgres-compatible runtimes.
