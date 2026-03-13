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

function tenantDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: env.defaultTenantTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function createPlayerJwt(playerId: string) {
  return signJwt(
    {
      sub: playerId,
      iss: 'https://api.puzzlebox.dev',
      aud: 'https://api.puzzlebox.dev',
      tid: env.defaultTenantSlug,
      scp: 'play'
    },
    env.jwtSecret,
    env.jwtTtlSeconds
  );
}

function createAnonymousPlayerToken() {
  const tenant = store.getTenantBySlug(env.defaultTenantSlug);
  if (!tenant) throw new Error('tenant_missing_in_test');
  const player = store.createAnonymousPlayer(tenant.id, 'America/New_York');
  return createPlayerJwt(player.id);
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

    const today = tenantDate();

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

  it('preserves existing config fields when patching only part of a game config', async () => {
    const app = buildApp();

    const createGame = await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Signal',
        slug: 'signal',
        mode: 'pick_one',
        config: {
          rounds_per_edition: 7,
          partial_credit: false,
          share_emoji_correct: '✅',
          share_emoji_incorrect: '❌',
          share_emoji_game: '📡',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: false
        }
      })
    });

    expect(createGame.status).toBe(201);

    const patchGame = await app.request('/api/v1/games/signal', {
      method: 'PATCH',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        config: {
          share_url_template: 'https://games.example.com/{slug}'
        }
      })
    });

    expect(patchGame.status).toBe(200);
    const patchedBody = await patchGame.json();
    expect(patchedBody.config).toEqual({
      rounds_per_edition: 7,
      partial_credit: false,
      share_emoji_correct: '✅',
      share_emoji_incorrect: '❌',
      share_emoji_game: '📡',
      share_url_template: 'https://games.example.com/{slug}',
      allow_anonymous: false
    });
  });

  it('returns snake_case resume state for today and session conflict flows', async () => {
    const app = buildApp();

    await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Resume Test',
        slug: 'resume-test',
        mode: 'pick_one',
        config: {
          rounds_per_edition: 1,
          partial_credit: true,
          share_emoji_correct: '🟩',
          share_emoji_incorrect: '🟥',
          share_emoji_game: '🧩',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: true
        }
      })
    });

    const createEdition = await app.request('/api/v1/games/resume-test/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: tenantDate(),
        status: 'active',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Who says this?',
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
    const authBody = await auth.json();

    const today = await app.request('/api/v1/games/resume-test/today', {
      method: 'GET',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${authBody.jwt as string}`
      }
    });
    const todayBody = await today.json();

    const startSession = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${authBody.jwt as string}`
      },
      body: JSON.stringify({ edition_id: todayBody.edition_id })
    });
    expect(startSession.status).toBe(201);

    const respond = await app.request(`/api/v1/sessions/${(await startSession.json()).session_id}/respond`, {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${authBody.jwt as string}`
      },
      body: JSON.stringify({
        round_id: todayBody.rounds[0].id,
        answer: { key: 'a' }
      })
    });
    expect(respond.status).toBe(200);

    const todayAgain = await app.request('/api/v1/games/resume-test/today', {
      method: 'GET',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${authBody.jwt as string}`
      }
    });
    expect(todayAgain.status).toBe(200);
    const resumedBody = await todayAgain.json();
    expect(resumedBody.existing_session).toEqual(
      expect.objectContaining({
        player_id: expect.any(String),
        edition_id: resumedBody.edition_id,
        started_at: expect.any(String),
        responses: [
          expect.objectContaining({
            session_id: expect.any(String),
            round_id: resumedBody.rounds[0].id,
            is_correct: true
          })
        ]
      })
    );
    expect(resumedBody.existing_session.playerId).toBeUndefined();

    const conflict = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${authBody.jwt as string}`
      },
      body: JSON.stringify({ edition_id: resumedBody.edition_id })
    });
    expect(conflict.status).toBe(409);
    const conflictBody = await conflict.json();
    expect(conflictBody).toEqual(
      expect.objectContaining({
        error: 'session_exists',
        existing_session: expect.objectContaining({
          player_id: expect.any(String),
          responses: expect.any(Array)
        })
      })
    );
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

  it('defaults lifecycle to production and exposes lifecycle policy in responses', async () => {
    const app = buildApp();

    const createGame = await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Drift',
        slug: 'drift',
        mode: 'ordered_sequence',
        config: {
          rounds_per_edition: 1,
          partial_credit: true,
          share_emoji_correct: '🟩',
          share_emoji_incorrect: '🟥',
          share_emoji_game: '🧭',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: true
        }
      })
    });

    expect(createGame.status).toBe(201);
    const createdBody = await createGame.json();
    expect(createdBody.lifecycle).toBe('production');
    expect(createdBody.policy).toEqual({
      max_unique_players: null,
      setup_model: 'paid'
    });

    const patchedToPlaytest = await app.request('/api/v1/games/drift', {
      method: 'PATCH',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({ lifecycle: 'playtest' })
    });
    expect(patchedToPlaytest.status).toBe(200);
    const playtestBody = await patchedToPlaytest.json();
    expect(playtestBody.lifecycle).toBe('playtest');
    expect(playtestBody.policy).toEqual({
      max_unique_players: 20,
      setup_model: 'free'
    });

    const patchedToProduction = await app.request('/api/v1/games/drift', {
      method: 'PATCH',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({ lifecycle: 'production' })
    });
    expect(patchedToProduction.status).toBe(200);
    const productionBody = await patchedToProduction.json();
    expect(productionBody.lifecycle).toBe('production');
    expect(productionBody.policy).toEqual({
      max_unique_players: null,
      setup_model: 'paid'
    });

    const createEdition = await app.request('/api/v1/games/drift/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: tenantDate(),
        status: 'active',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'BREECHES' },
              { key: 'b', label: 'PANTS' }
            ],
            correct_answer: { order: ['a', 'b'] },
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
    const authBody = await auth.json();

    const today = await app.request('/api/v1/games/drift/today', {
      method: 'GET',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${authBody.jwt as string}`
      }
    });
    expect(today.status).toBe(200);
    const todayBody = await today.json();
    expect(todayBody.game.lifecycle).toBe('production');
    expect(todayBody.game.policy).toEqual({
      max_unique_players: null,
      setup_model: 'paid'
    });
  });

  it('rejects session start for editions that are not active', async () => {
    const app = buildApp();

    await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Scheduled',
        slug: 'scheduled',
        mode: 'pick_one',
        config: {
          rounds_per_edition: 1,
          partial_credit: true,
          share_emoji_correct: '🟩',
          share_emoji_incorrect: '🟥',
          share_emoji_game: '🗓️',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: true
        }
      })
    });

    const createEdition = await app.request('/api/v1/games/scheduled/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: tenantDate(),
        status: 'scheduled',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Who says this?',
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
    const editionBody = await createEdition.json();

    const jwt = createAnonymousPlayerToken();

    const start = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({ edition_id: editionBody.id })
    });

    expect(start.status).toBe(409);
    expect(await start.json()).toEqual({
      error: 'edition_not_playable',
      status: 'scheduled'
    });
  });

  it('enforces playtest unique player cap but allows returning players', async () => {
    const app = buildApp();

    const createGame = await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Drift Playtest',
        slug: 'drift-playtest',
        mode: 'ordered_sequence',
        lifecycle: 'playtest',
        config: {
          rounds_per_edition: 1,
          partial_credit: true,
          share_emoji_correct: '🟩',
          share_emoji_incorrect: '🟥',
          share_emoji_game: '🧭',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: true
        }
      })
    });
    expect(createGame.status).toBe(201);

    const editionOne = await app.request('/api/v1/games/drift-playtest/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: tenantDate(),
        status: 'active',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'BREECHES' },
              { key: 'b', label: 'PANTS' }
            ],
            correct_answer: { order: ['a', 'b'] },
            metadata: {}
          }
        ]
      })
    });
    expect(editionOne.status).toBe(201);
    const editionOneBody = await editionOne.json();

    const editionTwo = await app.request('/api/v1/games/drift-playtest/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: tenantDate(1),
        status: 'active',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'BREECHES' },
              { key: 'b', label: 'PANTS' }
            ],
            correct_answer: { order: ['a', 'b'] },
            metadata: {}
          }
        ]
      })
    });
    expect(editionTwo.status).toBe(201);
    const editionTwoBody = await editionTwo.json();

    const playerTokens: string[] = [];

    for (let i = 0; i < 20; i += 1) {
      const jwt = createAnonymousPlayerToken();
      playerTokens.push(jwt);

      const start = await app.request('/api/v1/sessions', {
        method: 'POST',
        headers: {
          ...tenantHeaders(),
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ edition_id: editionOneBody.id })
      });
      expect(start.status).toBe(201);
    }

    const blockedJwt = createAnonymousPlayerToken();

    const blockedStart = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${blockedJwt}`
      },
      body: JSON.stringify({ edition_id: editionOneBody.id })
    });
    expect(blockedStart.status).toBe(403);
    const blockedStartBody = await blockedStart.json();
    expect(blockedStartBody).toEqual({
      error: 'playtest_capacity_reached',
      max_unique_players: 20,
      current_unique_players: 20
    });

    const returningPlayerStart = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${playerTokens[0]}`
      },
      body: JSON.stringify({ edition_id: editionTwoBody.id })
    });
    expect(returningPlayerStart.status).toBe(201);
  });

  it('does not apply playtest cap to production games', async () => {
    const app = buildApp();

    const createGame = await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Drift Production',
        slug: 'drift-production',
        mode: 'ordered_sequence',
        lifecycle: 'production',
        config: {
          rounds_per_edition: 1,
          partial_credit: true,
          share_emoji_correct: '🟩',
          share_emoji_incorrect: '🟥',
          share_emoji_game: '🧭',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: true
        }
      })
    });
    expect(createGame.status).toBe(201);

    const edition = await app.request('/api/v1/games/drift-production/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: tenantDate(),
        status: 'active',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'BREECHES' },
              { key: 'b', label: 'PANTS' }
            ],
            correct_answer: { order: ['a', 'b'] },
            metadata: {}
          }
        ]
      })
    });
    expect(edition.status).toBe(201);
    const editionBody = await edition.json();

    for (let i = 0; i < 21; i += 1) {
      const jwt = createAnonymousPlayerToken();

      const start = await app.request('/api/v1/sessions', {
        method: 'POST',
        headers: {
          ...tenantHeaders(),
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ edition_id: editionBody.id })
      });
      expect(start.status).toBe(201);
    }
  });

  it('uses ordered-sequence position count as max score when partial credit is enabled', async () => {
    const app = buildApp();

    await app.request('/api/v1/games', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        name: 'Timeline',
        slug: 'timeline',
        mode: 'ordered_sequence',
        config: {
          rounds_per_edition: 1,
          partial_credit: true,
          share_emoji_correct: '🟩',
          share_emoji_incorrect: '🟥',
          share_emoji_game: '🧭',
          share_url_template: 'https://play.example.com/{slug}',
          allow_anonymous: true
        }
      })
    });

    const createEdition = await app.request('/api/v1/games/timeline/editions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      },
      body: JSON.stringify({
        edition_date: tenantDate(),
        status: 'active',
        publish_at: null,
        metadata: {},
        rounds: [
          {
            position: 1,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'Alpha' },
              { key: 'b', label: 'Beta' },
              { key: 'c', label: 'Gamma' }
            ],
            correct_answer: { order: ['a', 'b', 'c'] },
            metadata: {}
          }
        ]
      })
    });
    const editionBody = await createEdition.json();

    const jwt = createAnonymousPlayerToken();

    const start = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({ edition_id: editionBody.id })
    });
    const startBody = await start.json();

    const editionDetail = await app.request(`/api/v1/editions/${editionBody.id}`, {
      method: 'GET',
      headers: {
        ...tenantHeaders(),
        'X-API-Key': env.defaultApiKey
      }
    });
    const editionDetailBody = await editionDetail.json();

    const respond = await app.request(`/api/v1/sessions/${startBody.session_id}/respond`, {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({
        round_id: editionDetailBody.rounds[0].id,
        answer: { order: ['a', 'c', 'b'] }
      })
    });
    expect(respond.status).toBe(200);

    const complete = await app.request(`/api/v1/sessions/${startBody.session_id}/complete`, {
      method: 'POST',
      headers: {
        ...tenantHeaders(),
        Authorization: `Bearer ${jwt}`
      }
    });
    expect(complete.status).toBe(200);
    const completeBody = await complete.json();
    expect(completeBody.score).toBe(1);
    expect(completeBody.max_score).toBe(3);
  });
});
