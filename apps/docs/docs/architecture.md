# Architecture

Puzzlebox is a multi-tenant API platform for daily-play games.

## Runtime shape

- API: Hono + Zod OpenAPI routes
- Data layer: Drizzle schema package (contract-first tables)
- Integrations: TypeScript SDK and Sheets sync tool
- Reference client: `apps/web`

## Operational flow

1. Editorial publishes editions with rounds.
2. Player starts a session for today’s edition.
3. Server validates responses and tracks score/streak.
4. Completion returns share payload.
5. Analytics endpoints expose tenant/game/edition performance.

## Deployment baseline

- API + Postgres: Railway pattern
- Frontend: Netlify or static hosting
- Local dev: Docker Compose + npm workspaces
