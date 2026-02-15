# Auth API

Puzzlebox supports four auth patterns so publishers can match local identity strategy.

## Auth endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /auth/magic-link` | Public | Sends sign-in link for email flow |
| `POST /auth/verify` | Public | Exchanges magic token for player JWT |
| `POST /auth/anonymous` | Public | Issues anonymous player JWT |
| `POST /auth/claim` | Public | Merges anonymous history into authenticated account |
| `POST /auth/external` | Public | BYO auth token exchange to Puzzlebox JWT |
| `GET /auth/oauth/{provider}/start` | Public | OAuth initiation (provider redirect flow) |
| `GET /auth/oauth/{provider}/callback` | Public | OAuth callback handling |

## Magic link flow

1. Frontend calls `POST /auth/magic-link` with email.
2. Backend returns `message` + expiry metadata.
3. User opens emailed token link.
4. Frontend submits token to `POST /auth/verify`.
5. API returns `jwt`, `player_id`, and `expires_at`.

### Request example

```json
{ "email": "player@example.com" }
```

### Verify response example

```json
{
  "player_id": "f4de2e7f-9e11-4cc7-ae6d-5fdde8b06350",
  "jwt": "eyJ...",
  "expires_at": "2026-02-15T12:00:00Z"
}
```

## Anonymous flow

Use this for low-friction first-play loops.

```json
POST /auth/anonymous
{
  "timezone": "America/New_York"
}
```

Returns a valid play-scoped JWT and marks `anonymous: true`.

## BYO external auth

`POST /auth/external` accepts a publisher token/session identifier. Puzzlebox maps or creates a local player, then returns a Puzzlebox JWT.

## JWT claims

```json
{
  "sub": "player_uuid",
  "iss": "https://api.puzzlebox.dev",
  "aud": "https://api.puzzlebox.dev",
  "iat": 1707900000,
  "exp": 1707986400,
  "jti": "uuid",
  "tid": "tenant_slug",
  "scp": "play"
}
```

## Security notes

- Verification is pinned to `HS256`.
- Tenant mismatch is rejected.
- API key access is separate from player JWT access.
