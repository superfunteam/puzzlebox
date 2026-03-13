#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${PUZZLEBOX_PG_CONTAINER_NAME:-puzzlebox-pg-smoke}"
DB_PORT="${PUZZLEBOX_PG_PORT:-55432}"
DB_NAME="${PUZZLEBOX_PG_DB:-puzzlebox}"
DB_USER="${PUZZLEBOX_PG_USER:-postgres}"
DB_PASSWORD="${PUZZLEBOX_PG_PASSWORD:-postgres}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker_cli_missing: install Docker CLI first." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "docker_daemon_unreachable: start Docker Desktop or run 'colima start'." >&2
  exit 1
fi

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Ensure no stale container is present.
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d --rm \
  --name "$CONTAINER_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -e POSTGRES_DB="$DB_NAME" \
  -p "$DB_PORT:5432" \
  postgres:16 >/dev/null

echo "waiting_for_postgres: container=$CONTAINER_NAME port=$DB_PORT"
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
  echo "postgres_not_ready_in_time" >&2
  exit 1
fi

export DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME"
export STORAGE_BACKEND="postgres"
export DATABASE_SSL="false"

echo "running_db_push"
npm run db:push

echo "running_api_tests_in_postgres_mode"
npm run test -w @puzzlebox/api
