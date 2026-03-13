import type { MiddlewareHandler } from 'hono';
import { store } from '../lib/store';

export const tenantMiddleware: MiddlewareHandler = async (c, next) => {
  const tenantSlug = c.req.header('X-Tenant');
  if (!tenantSlug) {
    return c.json({ error: 'missing_tenant', message: 'X-Tenant header is required' }, 400);
  }

  const tenant = await store.getTenantBySlug(tenantSlug);
  if (!tenant) {
    return c.json({ error: 'unknown_tenant' }, 404);
  }

  c.set('tenant', tenant);
  await next();
};
