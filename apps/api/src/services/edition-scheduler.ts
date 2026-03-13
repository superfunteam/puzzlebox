import { store } from '../lib/store';

let timer: NodeJS.Timeout | null = null;

export function startEditionScheduler(intervalMs = 60_000) {
  if (timer) return;
  timer = setInterval(() => {
    void store.activatePendingEditions();
  }, intervalMs);
}

export function stopEditionScheduler() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
