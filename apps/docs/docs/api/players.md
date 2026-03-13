# Players API

Player APIs cover profile data, deletion, and cross-game stats.

## Admin Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /players` | List tenant players |
| `GET /players/{id}` | Fetch one player |
| `DELETE /players/{id}` | Delete player and dependent records |

## Player Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /me/stats` | Cross-game stats for the current player |
| `PATCH /me` | Update timezone/display name |

## Response Notes

Player responses are normalized to external `snake_case`:

- `auth_method`
- `external_id`
- `display_name`
- `created_at`

Internal-only fields such as anonymous tokens are not part of the external API surface.

## `GET /me/stats`

This endpoint is useful for profile pages and retention surfaces. It aggregates:

- total sessions per game,
- current and longest streak,
- average score percentage,
- last played date,
- remaining freezes.
