<script setup lang="ts">
import { computed, ref } from 'vue';

type Audience = 'human' | 'agent';

interface TopPanel {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
}

interface LoopStep {
  title: string;
  body: string;
}

interface ModeCard {
  mode: string;
  title: string;
  details: string;
}

interface AudienceCopy {
  intro: string;
  signalPills: string[];
  panels: [TopPanel, TopPanel];
  loopTitle: string;
  loopSteps: LoopStep[];
  sampleEyebrow: string;
  sampleTitle: string;
  sampleLead: string;
  sampleSnippet: string;
  guardrailsTitle: string;
  guardrails: string[];
  docsTitle: string;
  docsIntro: string;
  modesTitle: string;
  modesIntro: string;
  modeCards: ModeCard[];
  footerSummary: string;
}

const audience = ref<Audience>('human');

const audienceCopy: Record<Audience, AudienceCopy> = {
  human: {
    intro: 'Human view uses plain language for product, editorial, and business stakeholders.',
    signalPills: [
      'Plain-language walkthrough',
      'No backend jargon required',
      'Built-in sharing and analytics',
      'Storage options: memory or Postgres'
    ],
    panels: [
      {
        eyebrow: 'What it gives your team',
        title: 'Publish daily games without rebuilding core tech every time.',
        body: 'Puzzlebox handles the repeatable infrastructure so teams can focus on great prompts, clear UX, and measurable outcomes.',
        bullets: [
          'Your editors publish rounds; Puzzlebox handles scoring and progress tracking.',
          'Players can leave and return without losing their place.',
          'Share text and streak data are ready at completion.',
          'The same API works for fast prototypes and durable production setups.'
        ]
      },
      {
        eyebrow: 'Why leaders care',
        title: 'It turns gameplay into usable signals right away.',
        body: 'You get consistent reporting surfaces from first launch through scale, so product and content teams can iterate using real player behavior.',
        bullets: [
          'Daily and per-game analytics are already modeled.',
          'Round-level performance shows where players get stuck.',
          'Validation lives on the server, so metrics stay trustworthy.',
          'Documentation stays aligned with actual runtime behavior.'
        ]
      }
    ],
    loopTitle: 'How the day-to-day game loop works',
    loopSteps: [
      {
        title: 'Pick a game format',
        body: 'Choose multiple choice, ordering, or survey-style rounds.'
      },
      {
        title: "Load today's playable edition",
        body: "Your app asks for today's game and gets all the round data it needs."
      },
      {
        title: 'Save progress naturally',
        body: 'If someone already started, Puzzlebox resumes their session instead of creating confusion.'
      },
      {
        title: 'Finish, share, and measure',
        body: 'Completion returns share-ready text plus structured data for reporting.'
      }
    ],
    sampleEyebrow: 'Simple walkthrough',
    sampleTitle: 'What one session feels like',
    sampleLead: 'This mirrors the real flow, without technical syntax.',
    sampleSnippet: String.raw`1. Ask Puzzlebox for today's edition.
2. If the player already started, reopen their existing session.
3. If they have not started, begin a new session.
4. Submit each answer and let Puzzlebox validate it.
5. Complete the session to get score, streak, and share copy.
6. Use analytics endpoints to track what happened.`,
    guardrailsTitle: 'What always stays consistent',
    guardrails: [
      'Every request is scoped to a tenant, so data stays separated.',
      'Admin and gameplay access are intentionally separated for safety.',
      'Session start is idempotent, so retries do not create duplicate sessions.',
      'Ordered-sequence rounds require each option exactly once to keep scoring clean.',
      'Storage mode is explicit: memory for throwaway runs, Postgres for durable environments.'
    ],
    docsTitle: 'Start here',
    docsIntro: 'These docs keep both technical and non-technical contributors aligned.',
    modesTitle: 'Pick the mode that matches player behavior',
    modesIntro: 'You do not need custom backend mechanics for each new game concept.',
    modeCards: [
      {
        mode: 'pick_one',
        title: 'Multiple choice',
        details: 'Players choose one answer. Puzzlebox handles correctness and simple scoring.'
      },
      {
        mode: 'ordered_sequence',
        title: 'Ranking or timeline',
        details: 'Players place items in order. Puzzlebox evaluates position-by-position, with optional partial credit.'
      },
      {
        mode: 'survey',
        title: 'Opinion and preference',
        details: 'Players submit a choice and receive crowd-distribution results instead of right/wrong scoring.'
      }
    ],
    footerSummary: 'Puzzlebox helps teams ship daily games faster, with less custom backend work and clearer operational visibility.'
  },
  agent: {
    intro: 'Agent view uses technical language for implementation, integration, and contract safety.',
    signalPills: [
      'OpenAPI contract at /doc',
      'Typed SDK: @puzzlebox/sdk',
      'Idempotent session lifecycle',
      'Storage: memory or postgres'
    ],
    panels: [
      {
        eyebrow: 'Agent Experience (AX)',
        title: 'Deterministic primitives and guardrails reduce generation drift.',
        body: 'Puzzlebox exposes explicit domain objects and consistent workflow semantics so generated frontends map to runtime behavior without brittle glue.',
        bullets: [
          'Gameplay bootstrap starts at GET /api/v1/games/{slug}/today.',
          'POST /api/v1/sessions is idempotent and can return session_exists.',
          'ordered_sequence answers must include every option key exactly once.',
          'Completion returns share_data and streak payloads for direct UI rendering.'
        ]
      },
      {
        eyebrow: 'Data-forward operations',
        title: 'Stable payloads from prototype to production analytics.',
        body: 'Puzzlebox keeps event and response shapes consistent so downstream product analytics and editorial tooling do not need frequent schema rewrites.',
        bullets: [
          'Tenant-scoped analytics endpoints: overview, per-game, and per-edition.',
          'Lifecycle policy is included in gameplay payloads for client branching.',
          'Server-side validation keeps scoring and distribution data authoritative.',
          'Docs, SDK, and OpenAPI remain contract-aligned for agent consumption.'
        ]
      }
    ],
    loopTitle: 'The loop agents ship',
    loopSteps: [
      {
        title: 'Model with existing primitives',
        body: 'Use pick_one, ordered_sequence, or survey instead of inventing new core entities.'
      },
      {
        title: 'Bootstrap and branch by payload',
        body: 'Resolve gameplay state via /today and existing_session before attempting a new session.'
      },
      {
        title: 'Respond and complete with guardrails',
        body: 'Submit round answers, handle session_completed/session_incomplete, and finalize once all rounds are answered.'
      },
      {
        title: 'Instrument outcomes',
        body: 'Capture share/streak data and analytics metrics without custom post-processing.'
      }
    ],
    sampleEyebrow: 'Copy-ready SDK flow',
    sampleTitle: 'TypeScript example',
    sampleLead: 'This is contract-accurate with idempotent resume behavior.',
    sampleSnippet: String.raw`import {
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
    guardrailsTitle: 'Contract guardrails that keep generated output correct',
    guardrails: [
      'External API payloads are snake_case.',
      'All requests include X-Tenant for scope resolution.',
      'Admin routes require X-API-Key; gameplay routes require bearer JWT.',
      'Frontend bootstrap starts at GET /api/v1/games/{slug}/today.',
      'Session start is idempotent; session_exists is a resume path, not an exception path.',
      'Storage backend is explicit: memory for throwaway runs, postgres for durable state.'
    ],
    docsTitle: 'Agent start pack',
    docsIntro: 'Use these docs to keep scaffolding, implementation, and operations aligned.',
    modesTitle: 'Choose the right gameplay mode',
    modesIntro: 'Mode selection should match player interaction, not custom backend complexity.',
    modeCards: [
      {
        mode: 'pick_one',
        title: 'Single-key answer',
        details: 'Binary correctness with direct per-round scoring and reveal metadata.'
      },
      {
        mode: 'ordered_sequence',
        title: 'Ordered array answer',
        details: 'Position-aware validation with optional partial credit and sequence-derived max score.'
      },
      {
        mode: 'survey',
        title: 'Distribution response',
        details: 'Participation scoring with aggregate distribution payloads and no correctness evaluation.'
      }
    ],
    footerSummary: 'Puzzlebox optimizes for fast, reliable agent implementation with stable contracts and production-safe runtime boundaries.'
  }
};

const resourceLinks = [
  {
    href: '/agent-quickstart',
    label: 'Agent Quickstart',
    human: 'High-level operating model and what to hand to technical builders.',
    agent: 'Constraints, guardrails, and copy/paste implementation prompt.'
  },
  {
    href: '/game-spec-template',
    label: 'Game Spec Template',
    human: 'A checklist to define your game clearly before implementation starts.',
    agent: 'Required input shape to avoid guessing and contract drift.'
  },
  {
    href: '/quickstart',
    label: '10-Minute Quickstart',
    human: 'A practical walkthrough from setup to one playable edition.',
    agent: 'Bootstrap path: create game, publish edition, play end-to-end.'
  },
  {
    href: '/storage',
    label: 'Storage',
    human: 'When to use simple local mode vs durable production persistence.',
    agent: 'Memory/postgres backend selection and environment constraints.'
  },
  {
    href: '/sdk',
    label: 'SDK',
    human: 'How the app talks to Puzzlebox through one typed client library.',
    agent: 'Method map and typed error handling for gameplay and admin flows.'
  },
  {
    href: '/api/overview',
    label: 'API Overview',
    human: 'A map of what endpoints exist and what each one is for.',
    agent: 'Contract semantics, object graph, and lifecycle guardrails.'
  }
] as const;

const copy = computed(() => audienceCopy[audience.value]);
</script>

<template>
  <section class="audience-switcher-wrap">
    <p class="lp-eyebrow">Audience Switch</p>
    <div class="audience-switcher" role="tablist" aria-label="Homepage language mode">
      <button
        role="tab"
        class="audience-switch-btn"
        :class="{ 'is-active': audience === 'human' }"
        :aria-selected="audience === 'human'"
        @click="audience = 'human'"
      >
        Human View
      </button>
      <button
        role="tab"
        class="audience-switch-btn"
        :class="{ 'is-active': audience === 'agent' }"
        :aria-selected="audience === 'agent'"
        @click="audience = 'agent'"
      >
        Agent View
      </button>
    </div>
    <p class="audience-switch-note">{{ copy.intro }}</p>
  </section>

  <div class="lp-signal-strip">
    <span v-for="pill in copy.signalPills" :key="pill">{{ pill }}</span>
  </div>

  <section class="lp-top-grid">
    <article v-for="panel in copy.panels" :key="panel.title" class="lp-panel">
      <p class="lp-eyebrow">{{ panel.eyebrow }}</p>
      <h2>{{ panel.title }}</h2>
      <p>{{ panel.body }}</p>
      <ul>
        <li v-for="bullet in panel.bullets" :key="bullet">{{ bullet }}</li>
      </ul>
    </article>
  </section>

  <h2>{{ copy.loopTitle }}</h2>

  <section class="lp-loop-grid">
    <article v-for="(step, index) in copy.loopSteps" :key="step.title" class="lp-loop-step">
      <p class="lp-step">{{ index + 1 }}</p>
      <h3>{{ step.title }}</h3>
      <p>{{ step.body }}</p>
    </article>
  </section>

  <section class="lp-sample-grid">
    <article class="lp-code-panel">
      <p class="lp-eyebrow">{{ copy.sampleEyebrow }}</p>
      <h3>{{ copy.sampleTitle }}</h3>
      <p class="lp-code-lead">{{ copy.sampleLead }}</p>
      <pre><code>{{ copy.sampleSnippet }}</code></pre>
    </article>
  </section>

  <section class="lp-callout">
    <h2>{{ copy.guardrailsTitle }}</h2>
    <ul>
      <li v-for="guardrail in copy.guardrails" :key="guardrail">{{ guardrail }}</li>
    </ul>
  </section>

  <section class="lp-resource-section">
    <h2>{{ copy.docsTitle }}</h2>
    <p class="lp-section-intro">{{ copy.docsIntro }}</p>
    <div class="resource-grid">
      <a v-for="link in resourceLinks" :key="link.href" :href="link.href" class="resource-card">
        <h3>{{ link.label }}</h3>
        <p>{{ audience === 'human' ? link.human : link.agent }}</p>
      </a>
    </div>
  </section>

  <section class="lp-mode-section">
    <h2>{{ copy.modesTitle }}</h2>
    <p class="lp-section-intro">{{ copy.modesIntro }}</p>
    <div class="mode-grid">
      <article v-for="card in copy.modeCards" :key="card.mode" class="mode-card">
        <p class="lp-eyebrow">{{ card.mode }}</p>
        <h3>{{ card.title }}</h3>
        <p>{{ card.details }}</p>
      </article>
    </div>
  </section>

  <footer class="docs-footer">
    <div class="footer-grid">
      <div>
        <h3>Puzzlebox</h3>
        <p>{{ copy.footerSummary }}</p>
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
    <p class="footer-meta">
      Puzzlebox keeps the same runtime model while tailoring explanation tone for people and agents.
    </p>
  </footer>
</template>
