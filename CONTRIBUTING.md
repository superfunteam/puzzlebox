# Contributing

1. Create a branch with the `codex/` prefix.
2. Keep changes scoped and include tests.
3. If you change API contracts, regenerate `openapi.baseline.json` with `npm run openapi:baseline`.
4. If you change core workflows, update the agent-facing docs in `apps/docs/docs/`.
5. Append task/test events to `ops/master-log.ndjson`.
6. Ensure CI passes: typecheck, test, build, openapi-drift.
