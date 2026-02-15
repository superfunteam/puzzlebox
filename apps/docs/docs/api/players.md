# Players API

Player APIs cover profile data, personal stats, and deletion for privacy compliance.

## Admin endpoints (API key)

| Endpoint | Purpose |
|---|---|
| `GET /players` | Tenant-scoped player list |
| `GET /players/{id}` | Player detail lookup |
| `DELETE /players/{id}` | GDPR/CCPA deletion of player and dependent records |

## Player endpoints (JWT)

| Endpoint | Purpose |
|---|---|
| `GET /me/stats` | Cross-game stats for current player |
| `PATCH /me` | Update timezone/display name |

## `GET /me/stats` response shape

```json
{
  "player_id": "uuid",
  "games": [
    {
      "game_slug": "who-says",
      "total_sessions": 45,
      "current_streak": 12,
      "longest_streak": 23,
      "average_score_pct": 0.78,
      "last_played": "2026-02-14",
      "freezes_remaining": 2
    }
  ]
}
```

## Deletion behavior

`DELETE /players/{id}` removes:

- Player profile
- Sessions
- Responses
- Streak records
- Related derived state

This endpoint is tenant-scoped and object-authorized.
