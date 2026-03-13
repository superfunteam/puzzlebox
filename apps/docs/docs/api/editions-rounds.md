# Editions & Rounds API

An edition is one day’s playable content for one game. Rounds are the ordered prompts inside that edition.

## Edition Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /games/{slug}/editions` | Create one edition with all rounds |
| `GET /games/{slug}/editions` | List editions for a game |
| `GET /editions/{id}` | Fetch an edition and its rounds |
| `PATCH /editions/{id}` | Update status, schedule, or metadata |
| `POST /editions/{id}/publish` | Mark an edition `active` |
| `POST /editions/{id}/archive` | Mark an edition `archived` |

## Round Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /editions/{id}/rounds` | List rounds for an edition |
| `PATCH /rounds/{id}` | Update a round while the edition is still draft |
| `DELETE /rounds/{id}` | Delete a round while the edition is still draft |

## Invariants

- Round count must match `game.config.rounds_per_edition`.
- `survey` rounds must not include `correct_answer`.
- Non-survey rounds must include `correct_answer`.
- `pick_one` `correct_answer.key` must exist in round options.
- `ordered_sequence` `correct_answer.order` must include every option key exactly once.
- Duplicate edition dates for the same game are rejected.
- Round patches are only allowed while the parent edition is `draft`.

## Response Shape

Admin edition and round responses are normalized to external `snake_case`.

That means agents should expect fields like:

- `edition_date`
- `publish_at`
- `correct_answer`
- `created_at`

not the internal TypeScript field names.
