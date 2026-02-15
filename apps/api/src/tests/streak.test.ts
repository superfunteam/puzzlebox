import { describe, expect, it } from 'vitest';
import { updateStreak } from '../services/streak';

describe('streak service', () => {
  it('increments consecutive days', () => {
    const streak = updateStreak({
      streak: {
        playerId: 'p',
        gameId: 'g',
        tenantId: 't',
        currentStreak: 1,
        longestStreak: 1,
        lastPlayedDate: '2026-02-14',
        freezesRemaining: 2,
        updatedAt: '2026-02-14T00:00:00Z'
      },
      player: {
        id: 'p',
        tenantId: 't',
        authMethod: 'anonymous',
        email: null,
        externalId: null,
        displayName: null,
        anonymousToken: null,
        timezone: 'America/New_York',
        createdAt: '2026-02-14T00:00:00Z',
        updatedAt: '2026-02-14T00:00:00Z'
      },
      tenant: {
        id: 't',
        name: 'T',
        slug: 'demo',
        timezone: 'America/New_York',
        authConfig: {},
        createdAt: '2026-02-14T00:00:00Z',
        updatedAt: '2026-02-14T00:00:00Z'
      },
      now: new Date('2026-02-15T15:00:00Z'),
      graceHours: 3
    });

    expect(streak.currentStreak).toBe(2);
    expect(streak.longestStreak).toBe(2);
  });
});
