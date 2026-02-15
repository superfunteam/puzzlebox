# API Overview

Base URL: `/api/v1`

## Auth models

- **Player JWT**: Bearer token for gameplay routes
- **API key**: Tenant-scoped admin/editor routes
- **Tenant resolution**: `X-Tenant` header

## API sections

- [Auth](/api/auth)
- [Games](/api/games)
- [Editions & Rounds](/api/editions-rounds)
- [Sessions & Gameplay](/api/sessions)
- [Players](/api/players)
- [Analytics](/api/analytics)
- [Rate Limits](/api/rate-limits)
- [Errors](/api/errors)

## Contract endpoints

- `GET /doc` for OpenAPI 3.1 JSON
- `GET /reference` for interactive API docs
