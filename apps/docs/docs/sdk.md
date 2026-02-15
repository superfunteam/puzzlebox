# TypeScript SDK

`@puzzlebox/sdk` provides a typed client for auth, gameplay, admin operations, and analytics.

## Install

```bash
npm install @puzzlebox/sdk
```

## Client setup

```ts
import { PuzzleboxClient } from '@puzzlebox/sdk';

const client = new PuzzleboxClient({
  baseUrl: 'https://api.puzzlebox.dev',
  tenant: 'michigan-public'
});
```

## Common flow

```ts
await client.authAnonymous({ timezone: 'America/Detroit' });
const today = await client.getToday('who-says');
const session = await client.startSession(String(today.edition_id));
await client.respond(session.session_id, {
  round_id: String((today.rounds as Array<{ id: string }>)[0].id),
  answer: { key: 'a' }
});
const complete = await client.completeSession(session.session_id);
```

## Admin flow

```ts
client.setApiKey(process.env.PUZZLEBOX_API_KEY!);
await client.createGame({...});
await client.createEdition('who-says', {...});
const analytics = await client.analyticsOverview();
```

## Error handling

The SDK throws `Error` with API `error` value as message when non-2xx responses are returned.
