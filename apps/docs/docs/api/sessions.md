# Sessions & Gameplay API

Sessions enforce one-attempt-per-player-per-edition and idempotent per-round responses.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /sessions` | Start edition session |
| `GET /sessions/{id}` | Inspect in-progress session state |
| `POST /sessions/{id}/respond` | Submit and validate a round answer |
| `POST /sessions/{id}/complete` | Finalize score, streak, and share payload |

## Gameplay loop

1. Fetch `GET /games/{slug}/today`.
2. Start with `POST /sessions`.
3. Respond per round via `POST /sessions/{id}/respond`.
4. Complete with `POST /sessions/{id}/complete`.

## Response validation by mode

### `pick_one`
- Input: `{ "key": "a" }`
- Returns correctness + correct answer + round metadata.

### `ordered_sequence`
- Input: `{ "order": ["c","a","d","b"] }`
- Returns per-position correctness and partial score.

### `survey`
- Input: `{ "key": "b" }`
- Returns distribution and total response counts.

## Completion output

`POST /sessions/{id}/complete` returns:

- `score` + `max_score`
- `streak` object
- `share_data` with server-formatted share text

## Time + streak behavior

- Streaks are computed server-side.
- Player timezone is preferred; tenant timezone is fallback.
- Grace windows and freeze consumption apply during streak updates.
