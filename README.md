# Puzzlebox

Puzzlebox is agent-first middleware for daily-play games. It gives you the reusable backend loop so a new game mostly becomes content, frontend UX, and editorial workflow.

## Start Here If You’re Handing This Repo To An Agent

Point the agent at these files first:

- `apps/docs/docs/agent-quickstart.md`
- `apps/docs/docs/game-spec-template.md`
- `apps/docs/docs/quickstart.md`

Those three docs are the shortest path from “here is my game idea” to “here is a working Puzzlebox-backed game.”

Concrete example handoffs already in the repo:

- `docs/Drift-Playtest-Agent-Handoff.md`
- `docs/Heatmap-Playtest-Agent-Handoff.md`

## What Puzzlebox Handles

- tenant scoping,
- game + edition + round primitives,
- session creation and resume,
- server-side answer validation,
- streaks and share payloads,
- analytics endpoints,
- a typed SDK and OpenAPI contract.

## Quick Local Boot

```bash
cp .env.example .env
npm install
npm run build
npm run start -w @puzzlebox/api
```

Useful URLs:

- OpenAPI JSON: `http://localhost:3000/doc`
- Interactive API docs: `http://localhost:3000/reference`
- Docs site: `npm run docs:dev`

## Repo Layout

- `apps/api`: Hono API and OpenAPI surface
- `apps/web`: reference playable client
- `apps/docs`: docs site and agent handoff docs
- `packages/shared`: shared enums, types, config helpers
- `packages/sdk`: typed TypeScript client
- `packages/db`: Drizzle schema package
- `tools/sheets-sync`: editorial ingestion helper

## Contract Snapshot

Generate the checked-in OpenAPI baseline with:

```bash
npm run openapi:baseline
```

This now produces the real generated OpenAPI 3.1 document rather than an empty placeholder.
