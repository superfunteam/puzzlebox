<script setup lang="ts">
import { computed, ref } from 'vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';

interface PrimitiveSpec {
  title: string;
  description: string;
  fileLabel: string;
  code: string;
}

const primitives: PrimitiveSpec[] = [
  {
    title: 'Tenant',
    description: 'Isolates each newsroom’s games, players, auth config, and analytics.',
    fileLabel: 'tenant.ts',
    code: `const tenant = {
  slug: 'michigan-public',
  timezone: 'America/Detroit',
  auth: ['magic_link', 'anonymous']
};

await adminClient.createTenant(tenant);`
  },
  {
    title: 'Game',
    description: 'Defines mode, scoring behavior, and share configuration for each title.',
    fileLabel: 'game.ts',
    code: `await adminClient.createGame({
  name: 'Who Says?',
  slug: 'who-says',
  mode: 'pick_one',
  config: { rounds_per_edition: 5 }
});`
  },
  {
    title: 'Edition',
    description: 'Represents one daily puzzle for a game, tied to date and publish lifecycle.',
    fileLabel: 'edition.ts',
    code: `await adminClient.createEdition('who-says', {
  edition_date: '2026-02-16',
  status: 'scheduled',
  rounds: [/* ... */]
});`
  },
  {
    title: 'Round',
    description: 'Stores prompt, options, and answer metadata for server-side validation.',
    fileLabel: 'round.ts',
    code: `const round = {
  position: 1,
  prompt: "Who says 'movers and shakers'?",
  options: [{ key: 'a', label: 'Anne' }, { key: 'b', label: 'Rebecca' }],
  correct_answer: { key: 'a' }
};`
  },
  {
    title: 'Session + Response',
    description: 'Tracks one attempt per player per edition with idempotent round submissions.',
    fileLabel: 'play.ts',
    code: `const session = await client.startSession(editionId);

await client.respond(session.session_id, {
  round_id,
  answer: { key: 'a' }
});`
  },
  {
    title: 'Streak + Share + Analytics',
    description: 'Calculates streaks, generates share payloads, and reports performance metrics.',
    fileLabel: 'complete.ts',
    code: `const done = await client.completeSession(session.session_id);
console.log(done.streak.current);
console.log(done.share_data.share_text);

const overview = await adminClient.analyticsOverview();`
  }
];

const activeIndex = ref(0);

const activePrimitive = computed(() => primitives[activeIndex.value] ?? primitives[0]);
const highlightedCode = computed(() =>
  Prism.highlight(activePrimitive.value.code, Prism.languages.typescript, 'typescript')
);

function activate(index: number) {
  activeIndex.value = index;
}
</script>

<template>
  <section class="inside-box">
    <div class="inside-copy">
      <p class="inside-kicker">What’s Inside the Box?</p>
      <h2>Framework primitives for every daily-play game.</h2>
      <p class="inside-lede">
        Puzzlebox gives you a consistent model so each new game only changes mechanics, not backend infrastructure.
      </p>

      <div class="primitive-list" aria-label="Puzzlebox primitives">
        <button
          v-for="(primitive, index) in primitives"
          :key="primitive.title"
          type="button"
          class="primitive-item"
          :class="{ 'is-active': index === activeIndex }"
          :aria-pressed="index === activeIndex"
          @click="activate(index)"
        >
          <h3>{{ primitive.title }}</h3>
          <p>{{ primitive.description }}</p>
        </button>
      </div>
    </div>

    <div class="inside-code-wrap">
      <div class="inside-code-card">
        <div class="inside-code-tabs">
          <span class="is-active">{{ activePrimitive.fileLabel }}</span>
          <span>{{ activePrimitive.title }}</span>
        </div>
        <pre><code class="language-ts" v-html="highlightedCode"></code></pre>
      </div>
    </div>
  </section>
</template>
