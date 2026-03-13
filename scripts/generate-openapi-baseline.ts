import { writeFileSync } from 'node:fs';
import { buildApp } from '../apps/api/src/app';
import { openApiDocument } from '../apps/api/src/lib/openapi-document';

const app = buildApp();
const baseline = app.getOpenAPI31Document(openApiDocument);

writeFileSync(new URL('../openapi.baseline.json', import.meta.url), `${JSON.stringify(baseline, null, 2)}\n`);
console.log('openapi.baseline.json updated');
