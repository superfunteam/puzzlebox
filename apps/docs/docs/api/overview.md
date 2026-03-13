# API Overview

Base URL: `/api/v1`

## Contract Rules

- External request/response JSON is `snake_case`.
- Tenant context is always supplied with `X-Tenant`.
- Admin routes use `X-API-Key`.
- Gameplay routes use player bearer tokens.
- Errors always include an `error` string.
- The generated OpenAPI document lives at `GET /doc`.

## Object Graph

```text
Tenant
  -> Game
     -> Edition
        -> Round

Player
  -> Session
     -> Response
```

## Gameplay Bootstrap

The intended frontend flow is:

1. `GET /games/{slug}/today`
2. If `existing_session` is present, resume it.
3. Otherwise `POST /sessions`
4. `POST /sessions/{id}/respond` per round
5. `POST /sessions/{id}/complete`

## Why Agents Should Care

This API is meant to be directly consumable by coding agents:

- response shapes are explicit,
- session resume is a first-class concept,
- playability rules are enforced server-side,
- the SDK mirrors the published contract.

## Sections

- [Auth](/api/auth)
- [Games](/api/games)
- [Editions & Rounds](/api/editions-rounds)
- [Sessions & Gameplay](/api/sessions)
- [Players](/api/players)
- [Analytics](/api/analytics)
- [Rate Limits](/api/rate-limits)
- [Errors](/api/errors)
