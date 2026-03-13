# Rate Limits

Puzzlebox applies endpoint-tier rate limits to protect gameplay integrity and reduce abuse.

## Default tiers

| Category | Limit | Key |
|---|---|---|
| `POST /auth/magic-link`, `POST /auth/verify`, `POST /auth/anonymous` | 10 req / 15 min | IP fallback (`x-forwarded-for`) |
| `POST /sessions/{id}/respond` | 30 req / min | Player ID or IP fallback |
| `GET /games`, `GET /players` | 200 req / min | Player ID or IP fallback |

## Response headers

- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`
- `Retry-After` (for `429`)

## Operational guidance

- Use exponential backoff on client retries.
- Treat `respond` limits as anti-bruteforce controls.
- Track repeated 429s per client version.
