# Analytics API

Analytics endpoints expose engagement and gameplay quality at tenant, game, and edition levels.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /analytics/overview` | Tenant-wide daily activity and game summary |
| `GET /games/{slug}/analytics` | Game-level engagement metrics |
| `GET /editions/{id}/analytics` | Per-edition completion and round performance |

## What You Get

### Overview

- `daily_active_players`
- `total_sessions_today`
- per-game completion snapshots

Daily activity is calculated using the tenant’s timezone, not raw UTC boundaries.

### Game Analytics

- completion rate
- average score percentage
- share rate
- return rate
- total sessions

### Edition Analytics

- total vs completed sessions
- completion rate
- max possible score
- per-round accuracy
- score distribution

## Agent Guidance

If you are building an MVP, analytics should usually be read-only. Consume these endpoints before inventing custom reporting tables.

Current baseline metrics are intentionally lightweight and derived from runtime session/response data.
