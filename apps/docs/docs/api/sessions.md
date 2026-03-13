# Sessions & Gameplay API

Sessions represent one player attempting one edition. They are the backbone of the daily gameplay loop.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /sessions` | Start an edition session |
| `GET /sessions/{id}` | Inspect current session state |
| `POST /sessions/{id}/respond` | Submit and validate a round answer |
| `POST /sessions/{id}/complete` | Finalize score, streak, and share payload |

## Session Start Rules

`POST /sessions` only succeeds when:

- the edition exists,
- the edition is `active`,
- the player has not already started that edition,
- the game has not exceeded playtest capacity.

Possible non-201 responses:

- `session_exists`: includes a full `existing_session` payload for resume.
- `edition_not_playable`: the edition is `draft`, `scheduled`, or `archived`.
- `playtest_capacity_reached`: a new player exceeded the free playtest cap.

## Resume Model

Frontend agents should treat resume as normal behavior:

1. Call `GET /games/{slug}/today`.
2. If `existing_session` is present, resume it.
3. If not, call `POST /sessions`.
4. If `POST /sessions` returns `session_exists`, resume that payload instead of failing.

## Response Validation By Mode

### `pick_one`

- Input: `{ "key": "a" }`
- Returns correctness, score, correct answer, and optional metadata.

### `ordered_sequence`

- Input: `{ "order": ["c","a","d","b"] }`
- Returns correctness, partial score, and `positions_correct`.
- Order must contain every option key exactly once.

When partial credit is enabled, `max_score` is derived from the number of positions in the correct order array.

### `survey`

- Input: `{ "key": "b" }`
- Returns crowd distribution instead of correctness.

## Completion Output

`POST /sessions/{id}/complete` returns:

- `score`
- `max_score`
- `duration_seconds`
- `streak`
- `share_data`

Possible `409` response:

- `session_incomplete` when not all rounds have a response.

`POST /sessions/{id}/respond` returns `session_completed` after a session has been finalized.

Frontends should render `share_data.share_text` directly instead of rebuilding share copy client-side.
