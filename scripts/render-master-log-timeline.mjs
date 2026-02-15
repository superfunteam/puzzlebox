import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const inputPath = new URL('../ops/master-log.ndjson', import.meta.url);
const outputPath = new URL('../ops/timeline.md', import.meta.url);

if (!existsSync(inputPath)) {
  console.error('missing ops/master-log.ndjson');
  process.exit(1);
}

const raw = readFileSync(inputPath, 'utf8').trim();
const lines = raw ? raw.split('\n') : [];
const events = lines
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));

const rows = events
  .map((event) => `| ${event.ts} | ${event.agent} | ${event.event} | ${event.task_id ?? ''} | ${event.note ?? ''} |`)
  .join('\n');

const markdown = [
  '# Master Log Timeline',
  '',
  '| Timestamp (UTC) | Agent | Event | Task | Note |',
  '|---|---|---|---|---|',
  rows || '| - | - | - | - | - |',
  ''
].join('\n');

mkdirSync(new URL('../ops', import.meta.url), { recursive: true });
writeFileSync(outputPath, markdown);
console.log(`timeline written: ${outputPath.pathname}`);
