# Rate Limits

Puzzlebox applies endpoint-tier rate limits to protect gameplay integrity and reduce abuse.

## Default tiers

| Category | Limit | Key |
|---|---|---|
| General authenticated API | 100 req/min | Player ID |
| Gameplay responses | 30 req/min | Player ID |
| Read-heavy endpoints | 200 req/min | Player ID |
| Login/signup endpoints | 10 req/15 min | IP |

## Response headers

- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`
- `Retry-After` (for `429`)

## Operational guidance

- Use exponential backoff on client retries.
- Treat `respond` limits as anti-bruteforce controls.
- Track repeated 429s per client version.
