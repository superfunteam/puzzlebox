<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import logoArt from '../logo.txt?raw';

const lines = logoArt.trimEnd().split('\n');

type Phase = 'logo' | 'pause' | 'command' | 'dots' | 'response' | 'done';

const rendered = ref('');
const cursorVisible = ref(true);
const phase = ref<Phase>('logo');
const commandText = ref('');
const dotsText = ref('');
const responseLines = ref<string[]>([]);

const COMMAND = 'puzzlebox init --game who-says --tenant demo';
const RESPONSE = [
  '\u001b[32m✓\u001b[0m  Created game: who-says',
  '\u001b[32m✓\u001b[0m  Tenant: demo',
  '\u001b[32m✓\u001b[0m  Mode: pick_one (4 rounds)',
  '\u001b[32m✓\u001b[0m  Storage: postgres',
  '\u001b[32m✓\u001b[0m  API running → http://localhost:3000',
  '',
  '  Ready. Publish your first edition:'
];
const RESPONSE_PLAIN = [
  '  ✓  Created game: who-says',
  '  ✓  Tenant: demo',
  '  ✓  Mode: pick_one (4 rounds)',
  '  ✓  Storage: postgres',
  '  ✓  API running → http://localhost:3000',
  '',
  '  Ready. Publish your first edition:',
  '  $ puzzlebox edition publish --date today'
];

let typingTimer: number | null = null;
let cursorTimer: number | null = null;
let phaseTimer: number | null = null;

function clearAllTimers() {
  [typingTimer, cursorTimer, phaseTimer].forEach((t) => {
    if (t !== null) window.clearTimeout(t);
  });
  typingTimer = null;
  cursorTimer = null;
  phaseTimer = null;
}

function typeCommand(text: string, index: number) {
  if (index > text.length) {
    phase.value = 'dots';
    dotsText.value = '';
    phaseTimer = window.setTimeout(() => typeDots(0), 300);
    return;
  }
  commandText.value = text.slice(0, index);
  const delay = 20 + Math.random() * 30;
  phaseTimer = window.setTimeout(() => typeCommand(text, index + 1), delay);
}

function typeDots(count: number) {
  if (count > 2) {
    phase.value = 'response';
    typeResponse(0);
    return;
  }
  dotsText.value = '.'.repeat(count + 1);
  phaseTimer = window.setTimeout(() => typeDots(count + 1), 400);
}

function typeResponse(lineIndex: number) {
  if (lineIndex >= RESPONSE_PLAIN.length) {
    phase.value = 'done';
    return;
  }
  responseLines.value = RESPONSE_PLAIN.slice(0, lineIndex + 1);
  const delay = lineIndex === 0 ? 100 : 60 + Math.random() * 80;
  phaseTimer = window.setTimeout(() => typeResponse(lineIndex + 1), delay);
}

onMounted(() => {
  const progress = lines.map(() => 0);
  const started = lines.map((_, index) => index === 0);
  const thresholds = lines.map((line) => Math.ceil(line.length / 3));

  typingTimer = window.setInterval(() => {
    let hasWork = false;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (!started[lineIndex]) continue;

      const line = lines[lineIndex] ?? '';
      if (progress[lineIndex] < line.length) {
        progress[lineIndex] += 1;
        hasWork = true;
      }

      if (
        lineIndex < lines.length - 1 &&
        !started[lineIndex + 1] &&
        progress[lineIndex] >= thresholds[lineIndex]
      ) {
        started[lineIndex + 1] = true;
        hasWork = true;
      }
    }

    const lastVisibleLine = started.lastIndexOf(true);
    rendered.value = lines
      .slice(0, lastVisibleLine + 1)
      .map((line, index) => line.slice(0, progress[index]))
      .join('\n');

    if (!hasWork) {
      if (typingTimer !== null) {
        window.clearInterval(typingTimer);
        typingTimer = null;
      }
      phase.value = 'pause';
      phaseTimer = window.setTimeout(() => {
        phase.value = 'command';
        typeCommand(COMMAND, 0);
      }, 600);
    }
  }, 5) as unknown as number;

  cursorTimer = window.setInterval(() => {
    cursorVisible.value = !cursorVisible.value;
  }, 420) as unknown as number;
});

onBeforeUnmount(() => {
  clearAllTimers();
});
</script>

<template>
  <div class="term-window">
    <!-- Window chrome -->
    <div class="term-titlebar">
      <span class="term-dot term-dot--red"></span>
      <span class="term-dot term-dot--yellow"></span>
      <span class="term-dot term-dot--green"></span>
      <span class="term-title">Terminal</span>
    </div>
    <!-- Terminal body -->
    <div class="term-body">
      <pre class="term-pre">{{ rendered }}</pre>
      <div v-if="phase === 'command' || phase === 'dots' || phase === 'response' || phase === 'done'" class="term-cmd-area">
        <div class="term-prompt-line">
          <span class="term-prompt">$</span>
          <span class="term-command">{{ commandText }}</span>
          <span v-if="phase === 'command'" class="term-caret" :class="{ 'is-hidden': !cursorVisible }">▌</span>
        </div>
        <div v-if="phase === 'dots'" class="term-dots">{{ dotsText }}</div>
        <div v-if="phase === 'response' || phase === 'done'" class="term-response">
          <div v-for="(line, i) in responseLines" :key="i" :class="{ 'term-response-line': true, 'term-success': line.includes('✓'), 'term-muted': line.startsWith('  Ready') || line.startsWith('  $') }">{{ line }}</div>
        </div>
      </div>
      <div v-if="phase === 'logo' || phase === 'pause'" class="term-prompt-line term-prompt-idle">
        <span class="term-prompt">$</span>
        <span class="term-caret" :class="{ 'is-hidden': !cursorVisible }">▌</span>
      </div>
    </div>
  </div>
</template>
