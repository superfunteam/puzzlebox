# Quickstart

## 1. Install and boot

```bash
cp .env.example .env
npm install
npm run build
npm run start -w @puzzlebox/api
```

API endpoints:
- OpenAPI JSON: `http://localhost:3000/doc`
- Interactive reference: `http://localhost:3000/reference`

## 2. Create a game

```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H 'X-Tenant: demo' \
  -H 'X-API-Key: dev-admin-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Who Says?",
    "slug":"who-says",
    "mode":"pick_one",
    "config":{
      "rounds_per_edition":5,
      "partial_credit":true,
      "share_emoji_correct":"🟩",
      "share_emoji_incorrect":"🟥",
      "share_emoji_game":"🎙️",
      "share_url_template":"https://play.example.com/{slug}",
      "allow_anonymous":true
    }
  }'
```

## 3. Publish today’s edition

Use `POST /api/v1/games/{slug}/editions` with all rounds in one payload.

## 4. Play as anonymous

1. `POST /api/v1/auth/anonymous`
2. `GET /api/v1/games/{slug}/today`
3. `POST /api/v1/sessions`
4. `POST /api/v1/sessions/{id}/respond`
5. `POST /api/v1/sessions/{id}/complete`

## 5. View analytics

Use:
- `GET /api/v1/analytics/overview`
- `GET /api/v1/games/{slug}/analytics`
- `GET /api/v1/editions/{id}/analytics`
