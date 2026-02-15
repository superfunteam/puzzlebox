# Editions & Rounds API

Editions are daily puzzle instances tied to one game. Rounds are ordered interaction units inside an edition.

## Edition endpoints

| Endpoint | Purpose |
|---|---|
| `POST /games/{slug}/editions` | Create full edition with all rounds |
| `GET /games/{slug}/editions` | List editions for a game |
| `GET /editions/{id}` | Fetch edition + rounds (includes answers for admin) |
| `PATCH /editions/{id}` | Update status/metadata/schedule |
| `POST /editions/{id}/publish` | Transition to `active` |
| `POST /editions/{id}/archive` | Transition to `archived` |

## Round endpoints

| Endpoint | Purpose |
|---|---|
| `GET /editions/{id}/rounds` | Round listing |
| `PATCH /rounds/{id}` | Update round (draft editions only) |
| `DELETE /rounds/{id}` | Delete round (draft editions only) |

## Required invariants

- Round count must match `game.config.rounds_per_edition`.
- `survey` rounds must have `correct_answer: null`.
- Non-survey rounds must include `correct_answer`.
- Duplicate edition date for same game is rejected (`409`).

## Publish semantics

- `scheduled` + `publish_at` supports auto-activation.
- Scheduler checks due editions on a fixed interval.
