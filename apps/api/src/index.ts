import { serve } from '@hono/node-server';
import { buildApp } from './app';
import { getEnv } from './lib/env';
import { store } from './lib/store';
import { startEditionScheduler } from './services/edition-scheduler';

const env = getEnv();

store.initDefaultTenant({
  slug: env.defaultTenantSlug,
  name: env.defaultTenantName,
  timezone: env.defaultTenantTimezone,
  apiKey: env.defaultApiKey
});

startEditionScheduler();

const app = buildApp();

serve(
  {
    fetch: app.fetch,
    port: env.port
  },
  (info) => {
    console.log(`Puzzlebox API listening on http://localhost:${info.port}`);
  }
);
