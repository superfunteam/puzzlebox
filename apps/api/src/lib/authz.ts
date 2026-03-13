import { verifyJwt } from './jwt';
import { getEnv } from './env';
import { store } from './store';

export async function requireAdmin(c: any): Promise<{ ok: true } | { ok: false; response: Response }> {
  const tenant = c.get('tenant');
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return { ok: false, response: c.json({ error: 'missing_api_key' }, 401) };
  }

  const record = await store.validateApiKey(tenant.id, apiKey);
  if (!record) {
    return { ok: false, response: c.json({ error: 'invalid_api_key' }, 403) };
  }

  c.set('apiScopes', record.scopes);
  return { ok: true };
}

export function requirePlayer(c: any): { ok: true; playerId: string } | { ok: false; response: Response } {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    return { ok: false, response: c.json({ error: 'missing_bearer_token' }, 401) };
  }

  const claims = verifyJwt(token, getEnv().jwtSecret);
  if (!claims || claims.scp !== 'play') {
    return { ok: false, response: c.json({ error: 'invalid_token' }, 401) };
  }

  const tenant = c.get('tenant');
  if (claims.tid !== tenant.slug) {
    return { ok: false, response: c.json({ error: 'tenant_mismatch' }, 403) };
  }

  c.set('claims', claims);
  c.set('playerId', claims.sub);
  return { ok: true, playerId: claims.sub };
}
