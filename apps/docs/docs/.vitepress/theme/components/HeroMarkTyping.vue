<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import logoArt from '../logo.txt?raw';

const lines = logoArt.trimEnd().split('\n');

const rendered = ref('');
const cursorVisible = ref(true);

let typingTimer: number | null = null;
let cursorTimer: number | null = null;

function clearTimers() {
  if (typingTimer !== null) {
    window.clearInterval(typingTimer);
    typingTimer = null;
  }
  if (cursorTimer !== null) {
    window.clearInterval(cursorTimer);
    cursorTimer = null;
  }
}

onMounted(() => {
  const progress = lines.map(() => 0);
  const started = lines.map((_, index) => index === 0);
  const thresholds = lines.map((line) => Math.ceil(line.length / 3));

  typingTimer = window.setInterval(() => {
    let hasWork = false;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (!started[lineIndex]) {
        continue;
      }

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
    }
  }, 5);

  cursorTimer = window.setInterval(() => {
    cursorVisible.value = !cursorVisible.value;
  }, 420);
});

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<template>
  <div class="hero-mark-wrap">
    <pre class="logo-block hero-mark">{{ rendered }}<span class="hero-caret" :class="{ 'is-hidden': !cursorVisible }">▌</span></pre>
  </div>
</template>
