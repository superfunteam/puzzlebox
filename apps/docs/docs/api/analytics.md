# Analytics API

Analytics endpoints expose engagement and gameplay quality at tenant, game, and edition levels.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /analytics/overview` | Tenant-wide daily active players + game summary |
| `GET /games/{slug}/analytics` | Game-level engagement and scoring metrics |
| `GET /editions/{id}/analytics` | Per-edition funnel, score distribution, and round difficulty |

## Overview payload focus

- `daily_active_players`
- `total_sessions_today`
- Game-level completion-rate snapshots

## Game analytics focus

- Completion rate
- Average score percentage
- Share rate
- Return rate
- Session totals

## Edition analytics focus

- Session starts vs completions (funnel)
- Per-round accuracy
- Score distribution
- Average duration

## Event taxonomy (recommended)

Track and correlate:

- `session.started`
- `round.responded`
- `session.completed`
- `share.generated`
- `streak.updated`
- `auth.login`

## Practical newsroom KPI joins

Use `external_id` alignment with subscriber systems to compute retention signals such as:

- Return rate delta for players with 7+ day streaks
- Completion vs share behavior by edition type
- Difficulty curves by round position
