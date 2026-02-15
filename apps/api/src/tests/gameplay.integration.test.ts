import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { getEnv } from '../lib/env';
import { signJwt } from '../lib/jwt';
import { store } from '../lib/store';

const env = getEnv();

function tenantHeaders() {
  return {
    'X-Tenant': env.defaultTenantSlug,
    'Content-Type': 'application/json'
  };
}

describe('core gameplay integration', () => {
  beforeEach(() => {
    store.__resetForTests();
    store.initDefaultTenant({
      slug: env.defaultTenantSlug,
      name: env.defaultTenantName,
      timezone: env.defaultTenantTimezone,
      apiKey: env.defaultApiKey
    });
  });

  it('supports create game -> edition -> session -> respond -> complete', async () => {
    const app = buildApp();

    const createGame = await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Who Says?',
        slug: 'who-says',
        mode: 'pick_one',
        config: {
          rounds_per_edition: 1,
          partial_credit: true,
          share_emoji_correct: '🟩',
          share_emoji_incorrect: '🟥',
          share_emoji_game: '🎙️',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: true
        }
      })
    });

    expect(createGame.status).toBe(201);

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: env.defaultTenantTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const createEdition = await app.request('/api/v1/games/who-says/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: today,
        status: 'active',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Who says movers and shakers?',
            options: [
              { key: 'a', label: 'Anne' },
              { key: 'b', label: 'Rebecca' }
            ],
            correct_answer: { key: 'a' },
            metadata: {}
          }
        ]
      })
    });

    expect(createEdition.status).toBe(201);

    const auth = await app.request('/api/v1/auth/anonymous', {
      method: 'POST',
      headers: tenantHeaders(),
      body: JSON.stringify({ timezone: 'America/New_York' })
    });
    expect(auth.status).toBe(200);
    const authBody = await auth.json();

    const playerToken = authBody.jwt as string;

    const todayRes = await app.request('/api/v1/games/who-says/today', {
      method: 'GET',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${playerToken}`
      }
    });

    expect(todayRes.status).toBe(200);
    const todayBody = await todayRes.json();

    const startSession = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${playerToken}`
      },
      body: JSON.stringify({ edition_id: todayBody.edition_id })
    });

    expect(startSession.status).toBe(201);
    const sessionBody = await startSession.json();

    const respond = await app.request(`/api/v1/sessions/${sessionBody.session_id}/respond`, {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${playerToken}`
      },
      body: JSON.stringify({
        round_id: todayBody.rounds[0].id,
        answer: { key: 'a' }
      })
    });

    expect(respond.status).toBe(200);

    const complete = await app.request(`/api/v1/sessions/${sessionBody.session_id}/complete`, {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${playerToken}`
      }
    });

    expect(complete.status).toBe(200);
    const completeBody = await complete.json();
    expect(completeBody.score).toBe(1);
  });

  it('enforces tenant isolation on player token', async () => {
    const app = buildApp();
    const jwt = signJwt(
      {
        sub: 'player-id',
        iss: 'https://api.puzzlebox.dev',
        aud: 'https://api.puzzlebox.dev',
        tid: 'other-tenant',
        scp: 'play'
      },
      env.jwtSecret,
      env.jwtTtlSeconds
    );

    const res = await app.request('/api/v1/games', {
      method: 'GET',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${jwt}`
      }
    });

    expect(res.status).toBe(403);
  });
});
