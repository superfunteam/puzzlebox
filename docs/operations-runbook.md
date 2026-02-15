# Operations Runbook

## Health checks
- API: `GET /healthz`
- OpenAPI: `GET /doc`
- Docs UI: `GET /reference`

## Incident response baseline
1. Confirm tenant impact and endpoint scope.
2. Check recent changes in `ops/master-log.ndjson`.
3. Roll back last deployment if error budget burn exceeds threshold.
4. Communicate tenant status update and ETA.

## Backup and restore drill
1. Verify managed Postgres backup snapshots.
2. Restore latest snapshot to staging.
3. Run smoke tests: auth, create edition, session complete.
4. Record RTO/RPO in release notes.
