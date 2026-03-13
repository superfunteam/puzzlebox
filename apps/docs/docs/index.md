---
layout: home

hero:
  name: "Puzzlebox"
  text: "Agent-first daily game framework"
  tagline: "Ship daily-play games with a contract-stable API, typed SDK, and a play loop built for coding agents: today -> start/resume -> respond -> complete."
  actions:
    - theme: brand
      text: Start With Agent Quickstart
      link: /agent-quickstart
    - theme: alt
      text: 10-Minute Quickstart
      link: /quickstart
    - theme: alt
      text: API Overview
      link: /api/overview

features:
  - title: Contract You Can Trust
    details: External JSON is snake_case with explicit tenant and auth boundaries, aligned across docs, SDK, and OpenAPI.
  - title: Resume Is First-Class
    details: Session start is idempotent, and session_exists is a normal control path instead of a client-side failure.
  - title: Mode-Aware Validation
    details: pick_one, ordered_sequence, and survey keep answer evaluation server-side so agent builds avoid scoring drift.
  - title: Data Surfaces Included
    details: share_data, streak payloads, and analytics endpoints are built in from day one for product and editorial teams.
---

<div class="lp-signal-strip">
  <span>Agent start pack included</span>
  <span>OpenAPI contract at <code>/doc</code></span>
  <span>Typed SDK at <code>@puzzlebox/sdk</code></span>
  <span>Baseline runtime: in-memory OSS API</span>
</div>

<section class="lp-top-grid">
  <article class="lp-panel">
    <p class="lp-eyebrow">Agent Experience (AX)</p>
    <h2>No fragile glue code, no hidden rules.</h2>
    <p>Puzzlebox gives agents a clear object model, strict contracts, and a deterministic gameplay loop so generated code stays usable after day one.</p>
    <ul>
      <li>Frontend bootstrap starts at <code>GET /api/v1/games/{slug}/today</code>.</li>
      <li><code>POST /api/v1/sessions</code> is idempotent and may return <code>session_exists</code>.</li>
      <li><code>ordered_sequence</code> answers must include every option key exactly once.</li>
      <li>Completion returns <code>share_data</code> and streak payloads ready for UI.</li>
    </ul>
  </article>
  <article class="lp-panel">
    <p class="lp-eyebrow">Data-forward Operations</p>
    <h2>Gameplay events become product signals immediately.</h2>
    <p>From first playtest to production, Puzzlebox keeps analytics shapes stable so teams can track engagement and quality without schema churn.</p>
    <ul>
      <li>Tenant-scoped analytics: overview, per-game, and per-edition surfaces.</li>
      <li>Playtest lifecycle policy is exposed in the gameplay payload.</li>
      <li>Server-side validation keeps scoring and distribution metrics trustworthy.</li>
      <li>OpenAPI, docs, and SDK stay in lockstep for agent reliability.</li>
    </ul>
  </article>
</section>

## The Loop Agents Ship

<section class="lp-loop-grid">
  <article class="lp-loop-step">
    <p class="lp-step">1</p>
    <h3>Model the game with existing primitives</h3>
    <p>Choose <code>pick_one</code>, <code>ordered_sequence</code>, or <code>survey</code> and publish one active edition for today.</p>
  </article>
  <article class="lp-loop-step">
    <p class="lp-step">2</p>
    <h3>Bootstrap once, branch by payload</h3>
    <p>Call <code>/today</code>, resume when <code>existing_session</code> is present, otherwise start a new session.</p>
  </article>
  <article class="lp-loop-step">
    <p class="lp-step">3</p>
    <h3>Respond + complete with guardrails</h3>
    <p>Submit per-round answers and complete only after all rounds; render <code>share_data.share_text</code> directly.</p>
  </article>
  <article class="lp-loop-step">
    <p class="lp-step">4</p>
    <h3>Instrument outcomes</h3>
    <p>Use analytics endpoints for completion rate, score distribution, and round-level performance data.</p>
  </article>
</section>

## Copy-Ready SDK Loop

```ts
import {
  PuzzleboxClient,
  isPuzzleboxApiError,
  type SessionExistsPayload
} from '@puzzlebox/sdk';

const client = new PuzzleboxClient({
  baseUrl: 'http://localhost:3000',
  tenant: 'demo'
});

await client.authAnonymous({ timezone: 'America/New_York' });
const today = await client.getToday('who-says');

let sessionId = today.existing_session?.id ?? null;
if (!sessionId) {
  try {
    sessionId = (await client.startSession(today.edition_id)).session_id;
  } catch (error) {
    if (
      isPuzzleboxApiError<SessionExistsPayload>(error) &&
      error.payload.error === 'session_exists'
    ) {
      sessionId = error.payload.existing_session.id;
    } else {
      throw error;
    }
  }
}

await client.respond(sessionId, {
  round_id: today.rounds[0].id,
  answer: { key: 'a' }
});

const complete = await client.completeSession(sessionId);
console.log(complete.share_data.share_text);
```

## Contract Guardrails That Keep Agent Output Correct

- External API JSON is `snake_case`.
- Every API request includes `X-Tenant`.
- Admin routes require `X-API-Key`.
- Gameplay routes require player bearer JWT.
- Frontend bootstrap starts at `GET /api/v1/games/{slug}/today`.
- Session start is idempotent (`session_exists` means resume).
- `ordered_sequence` answers must include every option key exactly once.
- OSS baseline runtime is in-memory; restarting the API resets runtime data.

## Agent Start Pack

- [/agent-quickstart](/agent-quickstart): operating model, hard constraints, and copy/paste handoff prompt.
- [/game-spec-template](/game-spec-template): the minimum spec needed for reliable agent delivery.
- [/quickstart](/quickstart): local boot plus first end-to-end API flow.
- [/sdk](/sdk): typed client methods and error handling patterns.
- [/api/overview](/api/overview): endpoint map and lifecycle behavior.

## Choose The Right Mode

| If the player is doing this | Use this mode | Backend behavior |
|---|---|---|
| Picking one answer from a set | `pick_one` | Correct-answer validation and binary per-round scoring |
| Ordering items into a sequence | `ordered_sequence` | Per-position correctness with optional partial credit |
| Giving an opinion or preference | `survey` | Participation scoring and crowd distribution payloads |

## Baseline Constraints (Important)

- API responses use `snake_case`.
- Tenant scope is always `X-Tenant`.
- Admin routes require `X-API-Key`.
- Gameplay routes require a player bearer token.
- Session start is idempotent and may return `session_exists`.
- `ordered_sequence` answers must include every option key exactly once.
- The OSS baseline API is in-memory; restarting the API resets runtime data.

<footer class="docs-footer">
  <div class="footer-grid">
    <div>
      <h3>Puzzlebox</h3>
      <p>Agent-first framework for shipping daily-play games with stable contracts and strong operational visibility.</p>
    </div>
    <div>
      <h4>Agent Docs</h4>
      <ul>
        <li><a href="/agent-quickstart">Agent Quickstart</a></li>
        <li><a href="/game-spec-template">Game Spec Template</a></li>
        <li><a href="/quickstart">10-Minute Quickstart</a></li>
      </ul>
    </div>
    <div>
      <h4>Platform</h4>
      <ul>
        <li><a href="/api/overview">API Overview</a></li>
        <li><a href="/architecture">Architecture</a></li>
        <li><a href="/sdk">SDK</a></li>
      </ul>
    </div>
  </div>
  <p class="footer-meta">Puzzlebox OSS baseline favors rapid agent iteration: reusable primitives, predictable APIs, and explicit runtime rules.</p>
</footer>
