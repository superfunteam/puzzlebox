import { writeFileSync } from 'node:fs';

const baseline = {
  openapi: '3.1.0',
  info: {
    title: 'Puzzlebox API',
    version: '0.1.0'
  },
  paths: {}
};

writeFileSync(new URL('../openapi.baseline.json', import.meta.url), JSON.stringify(baseline, null, 2));
console.log('openapi.baseline.json updated');
