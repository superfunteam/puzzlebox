# Games API

Games are tenant-scoped containers that define mode + config for daily editions.

## Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /games` | API key or player JWT | Admin list or player-visible active list |
| `POST /games` | API key | Create game |
| `GET /games/{slug}` | API key | Fetch game config |
| `PATCH /games/{slug}` | API key | Update metadata/config |
| `DELETE /games/{slug}` | API key | Soft delete (`active=false`) |
| `GET /games/{slug}/today` | Player JWT | Fetch active edition without correct answers |

## Create game payload

```json
{
  "name": "Who Says?",
  "slug": "who-says",
  "mode": "pick_one",
  "config": {
    "rounds_per_edition": 5,
    "partial_credit": true,
    "share_emoji_correct": "🟩",
    "share_emoji_incorrect": "🟥",
    "share_emoji_game": "🎙️",
    "share_url_template": "https://play.twts.org/{slug}",
    "allow_anonymous": true
  }
}
```

## `GET /games/{slug}/today`

Returns:

- Edition metadata
- Round prompts/options (no `correct_answer`)
- Existing session context if already started

This endpoint is the primary frontend bootstrap request.
