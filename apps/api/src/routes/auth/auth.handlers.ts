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
  magicLink(c: any) {
    const tenant = c.get('tenant');
    const { email } = c.req.valid('json');
    const token = store.createMagicLink(tenant.id, email, getEnv().jwtTtlSeconds);

    return c.json({
      message: 'Check your email',
      expires_in: 600,
      token_preview: token
    });
  },

  verify(c: any) {
    const tenant = c.get('tenant');
    const { token } = c.req.valid('json');
    const record = store.consumeMagicLink(token);

    if (!record || record.tenantId !== tenant.id) {
      return c.json({ error: 'invalid_magic_link' }, 401);
    }

    const player = store.createOrGetEmailPlayer(tenant.id, record.email, 'magic_link');
    const tokenData = playerToken(player.id, tenant.slug);

    return c.json({
      player_id: player.id,
      jwt: tokenData.jwt,
      expires_at: tokenData.expiresAt
    });
  },

  anonymous(c: any) {
    const tenant = c.get('tenant');
    const body = c.req.valid('json') as { timezone?: string };
    const player = store.createAnonymousPlayer(tenant.id, body.timezone ?? null);
    const tokenData = playerToken(player.id, tenant.slug);

    return c.json({
      player_id: player.id,
      jwt: tokenData.jwt,
      anonymous: true,
      expires_at: tokenData.expiresAt
    });
  },

  claim(c: any) {
    const tenant = c.get('tenant');
    const env = getEnv();
    const { anonymous_jwt: anonymousJwt, authenticated_jwt: authenticatedJwt } = c.req.valid('json');

    const anonClaims = verifyJwt(anonymousJwt, env.jwtSecret);
    const authClaims = verifyJwt(authenticatedJwt, env.jwtSecret);

    if (!anonClaims || !authClaims || anonClaims.tid !== tenant.slug || authClaims.tid !== tenant.slug) {
      return c.json({ error: 'invalid_claim_payload' }, 401);
    }

    const sessions = store
      .listSessionsByTenant(tenant.id)
      .filter((session) => session.playerId === anonClaims.sub);

    let merged = 0;
    for (const session of sessions) {
      const conflict = store
        .listSessionsByTenant(tenant.id)
        .find(
          (candidate) => candidate.playerId === authClaims.sub && candidate.editionId === session.editionId
        );
      if (conflict) continue;
      session.playerId = authClaims.sub;
      merged += 1;
    }

    return c.json({ player_id: authClaims.sub, sessions_merged: merged });
  },

  external(c: any) {
    const tenant = c.get('tenant');
    const { external_token: externalToken } = c.req.valid('json');
    const player = store.createOrGetExternalPlayer(tenant.id, externalToken);
    const tokenData = playerToken(player.id, tenant.slug);

    return c.json({
      player_id: player.id,
      jwt: tokenData.jwt,
      expires_at: tokenData.expiresAt
    });
  },

  oauthStart(c: any) {
    const provider = c.req.param('provider');
    return c.json({ provider, message: 'OAuth start is stubbed in OSS baseline' }, 501);
  },

  oauthCallback(c: any) {
    const provider = c.req.param('provider');
    return c.json({ provider, message: 'OAuth callback is stubbed in OSS baseline' }, 501);
  }
};
