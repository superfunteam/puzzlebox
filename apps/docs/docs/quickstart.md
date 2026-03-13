# Quickstart

This walkthrough gets you from a blank clone to one working daily edition.

If you are handing the repo to a new agent, start with [/agent-quickstart](/agent-quickstart) first.

> Storage behavior: if `DATABASE_URL` is set, Puzzlebox uses `postgres` and persists data. Without `DATABASE_URL`, it uses `memory` and API restart resets data.

## 1. Boot The Repo

```bash
cp .env.example .env
npm install
npm run db:push
npm run build
npm run start -w @puzzlebox/api
```

If you want a throwaway in-memory run, set `STORAGE_BACKEND=memory` in `.env` and skip the DB migration commands.

Useful local URLs:

- OpenAPI JSON: `http://localhost:3000/doc`
- Interactive API reference: `http://localhost:3000/reference`
- Docs site: `npm run docs:dev`

## 2. Create A Game

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

Notes:

- `lifecycle` defaults to `production`.
- `PATCH /games/{slug}` accepts partial config updates and preserves the rest of the config.

## 3. Publish Today’s Edition

```bash
TODAY=$(date +%F)

curl -X POST http://localhost:3000/api/v1/games/who-says/editions \
  -H 'X-Tenant: demo' \
  -H 'X-API-Key: dev-admin-key' \
  -H 'Content-Type: application/json' \
  -d "{
    \"edition_date\":\"${TODAY}\",
    \"status\":\"active\",
    \"publish_at\":null,
    \"metadata\":{},
    \"rounds\":[
      {
        \"position\":1,
        \"prompt\":\"Who says 'movers and shakers'?\",
        \"options\":[
          {\"key\":\"a\",\"label\":\"Anne\"},
          {\"key\":\"b\",\"label\":\"Rebecca\"}
        ],
        \"correct_answer\":{\"key\":\"a\"},
        \"metadata\":{\"explanation\":\"Anne uses it constantly.\"}
      },
      {
        \"position\":2,
        \"prompt\":\"Who says 'oddly enough'?\",
        \"options\":[
          {\"key\":\"a\",\"label\":\"Anne\"},
          {\"key\":\"b\",\"label\":\"Rebecca\"}
        ],
        \"correct_answer\":{\"key\":\"b\"},
        \"metadata\":{\"explanation\":\"Rebecca reaches for this more often.\"}
      },
      {
        \"position\":3,
        \"prompt\":\"Who says 'Reynolds Wrap' generically?\",
        \"options\":[
          {\"key\":\"a\",\"label\":\"Anne\"},
          {\"key\":\"b\",\"label\":\"Rebecca\"}
        ],
        \"correct_answer\":{\"key\":\"a\"},
        \"metadata\":{\"explanation\":\"Anne does this all the time.\"}
      },
      {
        \"position\":4,
        \"prompt\":\"Who says 'up to scratch'?\",
        \"options\":[
          {\"key\":\"a\",\"label\":\"Anne\"},
          {\"key\":\"b\",\"label\":\"Rebecca\"}
        ],
        \"correct_answer\":{\"key\":\"a\"},
        \"metadata\":{\"explanation\":\"Rebecca prefers 'up to snuff'.\"}
      },
      {
        \"position\":5,
        \"prompt\":\"Who says 'funnily enough'?\",
        \"options\":[
          {\"key\":\"a\",\"label\":\"Anne\"},
          {\"key\":\"b\",\"label\":\"Rebecca\"}
        ],
        \"correct_answer\":{\"key\":\"a\"},
        \"metadata\":{\"explanation\":\"It shows up in Anne's cadence more often.\"}
      }
    ]
  }"
```

## 4. Play The Game

1. Create a player token.

```bash
curl -X POST http://localhost:3000/api/v1/auth/anonymous \
  -H 'X-Tenant: demo' \
  -H 'Content-Type: application/json' \
  -d '{"timezone":"America/New_York"}'
```

Save `jwt` from the response as `JWT`.

2. Fetch the bootstrap payload.

```bash
curl http://localhost:3000/api/v1/games/who-says/today \
  -H 'X-Tenant: demo' \
  -H "Authorization: Bearer $JWT"
```

3. Start the session.

```bash
curl -X POST http://localhost:3000/api/v1/sessions \
  -H 'X-Tenant: demo' \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"edition_id":"<edition id>"}'
```

If this returns `409` with `session_exists`, resume the provided `existing_session`.

4. Respond per round.

```bash
curl -X POST http://localhost:3000/api/v1/sessions/<session id>/respond \
  -H 'X-Tenant: demo' \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"round_id":"<round id>","answer":{"key":"a"}}'
```

5. Complete and use `share_data`.

```bash
curl -X POST http://localhost:3000/api/v1/sessions/<session id>/complete \
  -H 'X-Tenant: demo' \
  -H "Authorization: Bearer $JWT"
```

If not all rounds have responses yet, completion returns:

```json
{
  "error": "session_incomplete",
  "answered_rounds": 3,
  "total_rounds": 5
}
```

## 5. Use The SDK Instead Of Raw Fetch In Frontends

```ts
import { PuzzleboxClient } from '@puzzlebox/sdk';

const client = new PuzzleboxClient({
  baseUrl: 'http://localhost:3000',
  tenant: 'demo'
});

await client.authAnonymous({ timezone: 'America/New_York' });
const today = await client.getToday('who-says');

const sessionId =
  today.existing_session?.id ??
  (await client.startSession(today.edition_id)).session_id;

await client.respond(sessionId, {
  round_id: today.rounds[0].id,
  answer: { key: 'a' }
});

const complete = await client.completeSession(sessionId);
console.log(complete.share_data.share_text);
```

The SDK throws `PuzzleboxApiError` for `session_exists`, `session_incomplete`, and other typed error payloads.

## 6. What To Read Next

- [/agent-quickstart](/agent-quickstart)
- [/game-spec-template](/game-spec-template)
- [/storage](/storage)
- [/sdk](/sdk)
- [/api/overview](/api/overview)
