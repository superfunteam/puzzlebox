import type { MiddlewareHandler } from 'hono';

interface Counter {
  windowStartMs: number;
  count: number;
}

const counters = new Map<string, Counter>();

function createRateLimitMiddleware(input: { keyPrefix: string; limit: number; windowMs: number }): MiddlewareHandler {
  return async (c, next) => {
    const playerId = c.get('playerId') ?? c.req.header('x-forwarded-for') ?? 'anon';
    const key = `${input.keyPrefix}:${playerId}`;
    const now = Date.now();
    const current = counters.get(key);

    if (!current || now - current.windowStartMs >= input.windowMs) {
      counters.set(key, { windowStartMs: now, count: 1 });
      c.header('RateLimit-Limit', `${input.limit}`);
      c.header('RateLimit-Remaining', `${input.limit - 1}`);
      c.header('RateLimit-Reset', `${Math.ceil((now + input.windowMs) / 1000)}`);
      await next();
      return;
    }

    if (current.count >= input.limit) {
      const retryAfter = Math.ceil((current.windowStartMs + input.windowMs - now) / 1000);
      c.header('Retry-After', `${retryAfter}`);
      c.header('RateLimit-Limit', `${input.limit}`);
      c.header('RateLimit-Remaining', '0');
      c.header('RateLimit-Reset', `${Math.ceil((current.windowStartMs + input.windowMs) / 1000)}`);
      return c.json({ error: 'rate_limited' }, 429);
    }

    current.count += 1;
    counters.set(key, current);
    c.header('RateLimit-Limit', `${input.limit}`);
    c.header('RateLimit-Remaining', `${Math.max(0, input.limit - current.count)}`);
    c.header('RateLimit-Reset', `${Math.ceil((current.windowStartMs + input.windowMs) / 1000)}`);
    await next();
  };
}

export const generalRateLimitMiddleware = createRateLimitMiddleware({
  keyPrefix: 'general',
  limit: 100,
  windowMs: 60_000
});

export const respondRateLimitMiddleware = createRateLimitMiddleware({
  keyPrefix: 'respond',
  limit: 30,
  windowMs: 60_000
});

export const readHeavyRateLimitMiddleware = createRateLimitMiddleware({
  keyPrefix: 'read',
  limit: 200,
  windowMs: 60_000
});

export const loginRateLimitMiddleware = createRateLimitMiddleware({
  keyPrefix: 'login',
  limit: 10,
  windowMs: 15 * 60_000
});
