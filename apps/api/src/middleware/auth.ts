import type { MiddlewareHandler } from 'hono';
import { verifyJwt } from '../lib/jwt';
import { getEnv } from '../lib/env';

export const playerAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    return c.json({ error: 'missing_bearer_token' }, 401);
  }

  const claims = verifyJwt(token, getEnv().jwtSecret);
  if (!claims || claims.scp !== 'play') {
    return c.json({ error: 'invalid_token' }, 401);
  }

  c.set('claims', claims);
  c.set('playerId', claims.sub);
  await next();
};
