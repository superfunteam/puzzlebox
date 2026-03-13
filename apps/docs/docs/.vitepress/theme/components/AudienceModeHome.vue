<script setup lang="ts">
import { computed } from 'vue';
import { audience } from '../composables/useAudience';
import HeroMarkTyping from './HeroMarkTyping.vue';

interface ContentCopy {
  headline: string;
  subheadline: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
  signals: string[];
  panels: Array<{
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
  }>;
  loopTitle: string;
  steps: Array<{ title: string; body: string }>;
  codeEyebrow: string;
  codeTitle: string;
  codeLead: string;
  codeSnippet: string;
  footerLine: string;
}

const content: Record<'human' | 'agent', ContentCopy> = {
  human: {
    headline: 'Ship daily-play games with scheduling, streaks, and analytics\u2009\u2014\u2009from one platform.',
    subheadline: 'Puzzlebox handles the repeatable infrastructure so your team can focus on great content, clear UX, and measurable outcomes.',
    primaryCta: { text: '5-Minute Quickstart', href: '/quickstart' },
    secondaryCta: { text: 'Explore the API', href: '/api/overview' },
    signals: [
      'Plain-language walkthrough',
      'No backend jargon',
      'Built-in sharing & analytics',
      'Memory or Postgres storage'
    ],
    panels: [
      {
        eyebrow: 'What it gives your team',
        title: 'Publish daily games without rebuilding core tech every time.',
        body: 'Your editors publish rounds. Puzzlebox handles scoring, progress tracking, and share-ready data at completion.',
        bullets: [
          'Players leave and return without losing progress.',
          'Share text and streak data ready at completion.',
          'Same API for fast prototypes and production.',
          'Daily and per-game analytics already modeled.'
        ]
      },
      {
        eyebrow: 'Why leaders care',
        title: 'Gameplay turns into usable signals immediately.',
        body: 'Consistent reporting from first launch through scale. Product and content teams iterate on real player behavior.',
        bullets: [
          'Round-level data shows where players get stuck.',
          'Server-side validation keeps metrics trustworthy.',
          'Docs stay aligned with runtime behavior.',
          'No custom analytics pipelines to maintain.'
        ]
      }
    ],
    loopTitle: 'The daily game loop',
    steps: [
      { title: 'Pick a format', body: 'Multiple choice, ordering, or survey-style rounds.' },
      { title: "Load today\u2019s edition", body: "Your app asks for today\u2019s game and gets all the round data it needs." },
      { title: 'Resume or start', body: 'If someone already started, Puzzlebox resumes their session automatically.' },
      { title: 'Finish & measure', body: 'Completion returns share-ready text plus structured data for reporting.' }
    ],
    codeEyebrow: 'Simple walkthrough',
    codeTitle: 'What one session looks like',
    codeLead: 'The real flow, without technical syntax.',
    codeSnippet: `1. Ask Puzzlebox for today\u2019s edition.
2. If the player already started, reopen their session.
3. If not, begin a new session.
4. Submit each answer \u2014 Puzzlebox validates it.
5. Complete the session to get score, streak, and share copy.
6. Use analytics endpoints to track what happened.`,
    footerLine: 'Puzzlebox helps teams ship daily games faster, with less custom backend work and clearer operational visibility.'
  },
  agent: {
    headline: 'Contract-first daily-game API with idempotent sessions, typed SDK, and stable guardrails.',
    subheadline: 'OpenAPI-first design with consistent schemas so teams and coding agents integrate quickly. Deterministic primitives, no brittle glue.',
    primaryCta: { text: 'Agent Quickstart', href: '/agent-quickstart' },
    secondaryCta: { text: 'SDK Reference', href: '/sdk' },
    signals: [
      'OpenAPI contract at /doc',
      'Typed SDK: @puzzlebox/sdk',
      'Idempotent session lifecycle',
      'Memory or Postgres backend'
    ],
    panels: [
      {
        eyebrow: 'Agent Experience (AX)',
        title: 'Deterministic primitives reduce generation drift.',
        body: 'Explicit domain objects and consistent workflow semantics. Generated frontends map to runtime behavior without guessing.',
        bullets: [
          'Bootstrap at GET /api/v1/games/{slug}/today.',
          'POST /sessions is idempotent \u2014 session_exists is a resume path.',
          'ordered_sequence answers must include every option key exactly once.',
          'Completion returns share_data and streak payloads for direct rendering.'
        ]
      },
      {
        eyebrow: 'Data-forward operations',
        title: 'Stable payloads from prototype to production.',
        body: 'Event and response shapes stay consistent. Downstream analytics and tooling skip frequent schema rewrites.',
        bullets: [
          'Tenant-scoped analytics: overview, per-game, per-edition.',
          'Lifecycle policy in gameplay payloads for client branching.',
          'Server-side validation keeps scoring authoritative.',
          'Docs, SDK, and OpenAPI remain contract-aligned.'
        ]
      }
    ],
    loopTitle: 'The loop agents ship',
    steps: [
      { title: 'Model with primitives', body: 'Use pick_one, ordered_sequence, or survey \u2014 no new entities.' },
      { title: 'Bootstrap by payload', body: 'Resolve state via /today and existing_session before starting.' },
      { title: 'Respond with guardrails', body: 'Submit answers, handle session states, finalize when complete.' },
      { title: 'Instrument outcomes', body: 'Capture share/streak data and analytics without post-processing.' }
    ],
    codeEyebrow: 'Copy-ready SDK flow',
    codeTitle: 'TypeScript example',
    codeLead: 'Contract-accurate with idempotent resume behavior.',
    codeSnippet: `import {
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
console.log(complete.share_data.share_text);`,
    footerLine: 'Puzzlebox optimizes for fast, reliable agent implementation with stable contracts and production-safe runtime boundaries.'
  }
};

const copy = computed(() => content[audience.value]);
</script>

<template>
  <!-- Hero: ASCII mark + headline -->
  <section class="pb-hero-text">
    <HeroMarkTyping />
    <h1 class="pb-headline">{{ copy.headline }}</h1>
    <p class="pb-subheadline">{{ copy.subheadline }}</p>
    <div class="pb-actions">
      <a :href="copy.primaryCta.href" class="pb-btn pb-btn-primary">{{ copy.primaryCta.text }}</a>
      <a :href="copy.secondaryCta.href" class="pb-btn pb-btn-secondary">{{ copy.secondaryCta.text }}</a>
    </div>
  </section>

  <!-- Signal pills -->
  <section class="pb-signals">
    <span v-for="(pill, i) in copy.signals" :key="i" class="pb-pill">{{ pill }}</span>
  </section>

  <!-- Value panels -->
  <section class="pb-panels">
    <article v-for="(panel, i) in copy.panels" :key="i" class="pb-panel">
      <p class="pb-eyebrow">{{ panel.eyebrow }}</p>
      <h2>{{ panel.title }}</h2>
      <p class="pb-panel-body">{{ panel.body }}</p>
      <ul>
        <li v-for="(bullet, j) in panel.bullets" :key="j">{{ bullet }}</li>
      </ul>
    </article>
  </section>

  <!-- Game loop steps -->
  <section class="pb-loop-section">
    <h2 class="pb-section-title">{{ copy.loopTitle }}</h2>
    <div class="pb-steps">
      <article v-for="(step, i) in copy.steps" :key="i" class="pb-step">
        <span class="pb-step-num">{{ i + 1 }}</span>
        <h3>{{ step.title }}</h3>
        <p>{{ step.body }}</p>
      </article>
    </div>
  </section>

  <!-- Code / walkthrough -->
  <section class="pb-code-section">
    <p class="pb-eyebrow">{{ copy.codeEyebrow }}</p>
    <h3 class="pb-code-title">{{ copy.codeTitle }}</h3>
    <p class="pb-code-lead">{{ copy.codeLead }}</p>
    <pre class="pb-code-block"><code>{{ copy.codeSnippet }}</code></pre>
  </section>

  <!-- Footer -->
  <footer class="pb-footer">
    <div class="pb-footer-grid">
      <div>
        <h3 class="pb-footer-brand">Puzzlebox</h3>
        <p>{{ copy.footerLine }}</p>
      </div>
      <div>
        <h4>Get Started</h4>
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
  </footer>
</template>
