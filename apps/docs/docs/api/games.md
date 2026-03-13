# Games API

Games define the stable rules of a title: mode, lifecycle, config, and policy.

## Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /games` | API key or player JWT | Admin list or player-visible active list |
| `POST /games` | API key | Create game |
| `GET /games/{slug}` | API key | Fetch game config |
| `PATCH /games/{slug}` | API key | Update metadata/config |
| `DELETE /games/{slug}` | API key | Soft delete (`active=false`) |
| `GET /games/{slug}/today` | Player JWT | Frontend bootstrap payload |

## Important Fields

- `mode`: `pick_one`, `ordered_sequence`, or `survey`
- `lifecycle`: `playtest` or `production`
- `policy`: derived server-side from `lifecycle`

## Patch Behavior

`PATCH /games/{slug}` accepts partial config updates.

That means this is valid:

```json
{
  "config": {
    "share_url_template": "https://games.example.com/{slug}"
  }
}
```

Unspecified config fields are preserved.

## `GET /games/{slug}/today`

This is the main client bootstrap payload. It returns:

- edition metadata for the current tenant-local day,
- public round data without `correct_answer`,
- the game lifecycle + policy,
- `existing_session` when the player has already started.

Agents building frontends should begin here, not by stitching multiple admin endpoints together.

## Lifecycle Notes

- `playtest`: capped to 20 unique players per game.
- `production`: no unique-player cap.

The lifecycle is also exposed as `policy` so the frontend or admin tooling can branch without hard-coding business rules.
