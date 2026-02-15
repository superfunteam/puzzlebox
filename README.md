# Puzzlebox

Open-source middleware for daily-play games for newsrooms.

## Quickstart

```bash
cp .env.example .env
npm install
npm run build
npm run start -w @puzzlebox/api
```

API docs:
- OpenAPI JSON: `http://localhost:3000/doc`
- Scalar reference: `http://localhost:3000/reference`

## Monorepo layout

- `apps/api`: Hono API
- `apps/web`: React reference app
- `packages/db`: Drizzle schema and migrations
- `packages/shared`: shared constants/types/schemas
- `packages/sdk`: TypeScript API client
- `tools/sheets-sync`: Sheets ingestion helper
- `ops/master-log.ndjson`: append-only build/task log

## Status

Initial implementation scaffold and core API routes are included. See `ops/master-log.ndjson` for task/event history.
