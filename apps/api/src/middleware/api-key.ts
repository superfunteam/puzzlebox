import type { MiddlewareHandler } from 'hono';
import { store } from '../lib/store';

export const apiKeyAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const tenant = c.get('tenant');
  const apiKey = c.req.header('X-API-Key');

  if (!apiKey) {
    return c.json({ error: 'missing_api_key' }, 401);
  }

  const record = store.validateApiKey(tenant.id, apiKey);
  if (!record) {
    return c.json({ error: 'invalid_api_key' }, 403);
  }

  c.set('apiScopes', record.scopes);
  await next();
};
