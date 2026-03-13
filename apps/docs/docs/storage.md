# Storage

Puzzlebox keeps the external API contract stable across backends.

Use storage mode per environment, not per feature.

## Backend Selection

- `memory`: fastest local prototyping; API restart resets runtime data.
- `postgres`: durable runtime for production and shared environments.

Selection rules:

- `DATABASE_URL` set -> defaults to `postgres`.
- `DATABASE_URL` unset -> defaults to `memory`.
- `STORAGE_BACKEND` explicitly overrides either mode.

## Environment Variables

```bash
# Required for postgres mode
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB

# Optional overrides
DATABASE_SSL=true
STORAGE_BACKEND=postgres
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_MS=30000
DATABASE_POOL_CONNECTION_TIMEOUT_MS=10000
```

## Durable Postgres Setup (Supabase Or Self-Hosted)

1. Provision a Postgres instance.
2. Set `DATABASE_URL` (and `DATABASE_SSL=true` for managed TLS providers).
3. Apply schema:

```bash
npm run db:push
```

4. Start API:

```bash
npm run build
npm run start -w @puzzlebox/api
```

For a local end-to-end Postgres smoke test (container + migrations + API tests):

```bash
npm run test:api:postgres
```

## Supabase Notes

- Puzzlebox uses plain Postgres (`pg` + Drizzle), so Supabase-hosted and Supabase self-hosted both work.
- Prefer a dedicated database user for Puzzlebox runtime.
- For migrations, use a connection with DDL privileges.
- Keep Supabase service credentials server-side only; clients should call Puzzlebox API, not write Puzzlebox tables directly.

## Self-Hosted Hardening Checklist

- Enable automated backups and point-in-time recovery.
- Run a connection pooler for high-concurrency workloads.
- Restrict DB user privileges to required schemas/tables.
- Monitor slow queries and connection saturation.
- Run `db:push` as part of deploy before new API instances receive traffic.

## When You Change Schema

If you modify files in `packages/db/src/schema`, generate and commit a new migration:

```bash
npm run db:generate
```

## Local Throwaway Mode

Use this when you only need fast agent iteration and no persistence.

```bash
STORAGE_BACKEND=memory
```

In this mode, restarting the API clears runtime state.

## Docker Daemon Troubleshooting (Local Postgres Smoke Tests)

If you see `Cannot connect to the Docker daemon`, Docker CLI is installed but no running container engine is reachable.

Fix sequence:

1. Start your engine:
   - Docker Desktop: open app and wait for `Engine running`.
   - Colima: run `colima start`.
2. Verify:

```bash
docker info
docker ps
```

3. Re-run your Postgres container command.
