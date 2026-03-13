# TypeScript SDK

`@puzzlebox/sdk` is the fastest way for an agent or frontend engineer to stay on the published contract.

## Install

```bash
npm install @puzzlebox/sdk
```

## Create A Client

```ts
import { PuzzleboxClient } from '@puzzlebox/sdk';

const client = new PuzzleboxClient({
  baseUrl: 'https://api.puzzlebox.dev',
  tenant: 'michigan-public'
});
```

## Gameplay Flow

```ts
await client.authAnonymous({ timezone: 'America/Detroit' });

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

## Admin Flow

```ts
client.setApiKey(process.env.PUZZLEBOX_API_KEY!);

await client.createGame({
  name: 'Who Says?',
  slug: 'who-says',
  mode: 'pick_one',
  config: {
    rounds_per_edition: 5,
    partial_credit: true,
    share_emoji_correct: '🟩',
    share_emoji_incorrect: '🟥',
    share_emoji_game: '🎙️',
    share_url_template: 'https://play.example.com/{slug}',
    allow_anonymous: true
  }
});

await client.createEdition('who-says', {
  edition_date: '2026-02-16',
  status: 'active',
  rounds: [
    {
      position: 1,
      prompt: "Who says 'movers and shakers'?",
      options: [
        { key: 'a', label: 'Anne' },
        { key: 'b', label: 'Rebecca' }
      ],
      correct_answer: { key: 'a' }
    }
  ]
});
```

## Typed Error Handling

The SDK throws `PuzzleboxApiError` and keeps the response payload on the error object.

```ts
import { isPuzzleboxApiError, type SessionExistsPayload } from '@puzzlebox/sdk';

try {
  await client.startSession(today.edition_id);
} catch (error) {
  if (
    isPuzzleboxApiError<SessionExistsPayload>(error) &&
    error.payload.error === 'session_exists'
  ) {
    console.log('Resume', error.payload.existing_session.id);
  }
}
```

This matters for agent-generated frontends because idempotent session creation is expected behavior, not an edge case.

The same pattern applies to other workflow errors such as:

- `session_incomplete` on early `completeSession`,
- `session_completed` on late `respond`.

## Useful Methods

- `authAnonymous`
- `listGames`
- `getGame`
- `patchGame`
- `createGame`
- `createEdition`
- `listEditions`
- `getEdition`
- `getToday`
- `startSession`
- `getSession`
- `respond`
- `completeSession`
- `analyticsOverview`
- `getGameAnalytics`
- `getEditionAnalytics`
- `listPlayers`
- `getMyStats`
- `updateMe`

## When To Prefer The SDK

Use the SDK when:

- you are building a frontend,
- you want typed resume/error flows,
- you want contract drift to break at compile time instead of runtime.

Use raw HTTP only when you are scripting outside TypeScript or testing the API surface directly.
