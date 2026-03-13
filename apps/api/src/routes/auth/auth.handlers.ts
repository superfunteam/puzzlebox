import { getEnv } from '../../lib/env';
import { signJwt, verifyJwt } from '../../lib/jwt';
import { store } from '../../lib/store';

function playerToken(playerId: string, tenantSlug: string) {
  const env = getEnv();
  const jwt = signJwt(
    {
      sub: playerId,
      iss: 'https://api.puzzlebox.dev',
      aud: 'https://api.puzzlebox.dev',
      tid: tenantSlug,
      scp: 'play'
    },
    env.jwtSecret,
    env.jwtTtlSeconds
  );

  const expiresAt = new Date(Date.now() + env.jwtTtlSeconds * 1000).toISOString();

  return { jwt, expiresAt };
}

export const authHandlers = {
  async magicLink(c: any) {
    const tenant = c.get('tenant');
    const { email } = c.req.valid('json');
    const env = getEnv();
    const token = await store.createMagicLink(tenant.id, email, env.magicLinkTtlSeconds);

    return c.json({
      message: 'Check your email',
      expires_in: env.magicLinkTtlSeconds,
      token_preview: token
    });
  },

  async verify(c: any) {
    const tenant = c.get('tenant');
    const { token } = c.req.valid('json');
    const record = await store.consumeMagicLink(token);

    if (!record || record.tenantId !== tenant.id) {
      return c.json({ error: 'invalid_magic_link' }, 401);
    }

    const player = await store.createOrGetEmailPlayer(tenant.id, record.email, 'magic_link');
    const tokenData = playerToken(player.id, tenant.slug);

    return c.json({
      player_id: player.id,
      jwt: tokenData.jwt,
      expires_at: tokenData.expiresAt
    });
  },

  async anonymous(c: any) {
    const tenant = c.get('tenant');
    const body = (c.req.valid('json') ?? {}) as { timezone?: string };
    const player = await store.createAnonymousPlayer(tenant.id, body.timezone ?? null);
    const tokenData = playerToken(player.id, tenant.slug);

    return c.json({
      player_id: player.id,
      jwt: tokenData.jwt,
      anonymous: true,
      expires_at: tokenData.expiresAt
    });
  },

  async claim(c: any) {
    const tenant = c.get('tenant');
    const env = getEnv();
    const { anonymous_jwt: anonymousJwt, authenticated_jwt: authenticatedJwt } = c.req.valid('json');

    const anonClaims = verifyJwt(anonymousJwt, env.jwtSecret);
    const authClaims = verifyJwt(authenticatedJwt, env.jwtSecret);

    if (!anonClaims || !authClaims || anonClaims.tid !== tenant.slug || authClaims.tid !== tenant.slug) {
      return c.json({ error: 'invalid_claim_payload' }, 401);
    }

    const allSessions = await store.listSessionsByTenant(tenant.id);
    const sessions = allSessions.filter((session) => session.playerId === anonClaims.sub);

    let merged = 0;
    for (const session of sessions) {
      const conflict = allSessions.find(
        (candidate) => candidate.playerId === authClaims.sub && candidate.editionId === session.editionId
      );
      if (conflict) continue;
      session.playerId = authClaims.sub;
      merged += 1;
    }

    return c.json({ player_id: authClaims.sub, sessions_merged: merged });
  },

  async external(c: any) {
    const tenant = c.get('tenant');
    const { external_token: externalToken } = c.req.valid('json');
    const player = await store.createOrGetExternalPlayer(tenant.id, externalToken);
    const tokenData = playerToken(player.id, tenant.slug);

    return c.json({
      player_id: player.id,
      jwt: tokenData.jwt,
      expires_at: tokenData.expiresAt
    });
  }
};
