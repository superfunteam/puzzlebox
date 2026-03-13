import { describe, expect, it } from 'vitest';
import { getSessionMaxScore, scoreOrderedSequence, scorePickOne, scoreSurvey } from '../services/scoring';

describe('scoring service', () => {
  it('scores pick_one', () => {
    expect(scorePickOne({ key: 'a' }, { key: 'a' }).score).toBe(1);
    expect(scorePickOne({ key: 'b' }, { key: 'a' }).score).toBe(0);
  });

  it('scores ordered_sequence with partial credit', () => {
    const result = scoreOrderedSequence({ order: ['a', 'b', 'c'] }, { order: ['a', 'c', 'b'] }, true);
    expect(result.score).toBe(1);
    expect(result.positionsCorrect).toEqual([true, false, false]);
  });

  it('scores survey as participation', () => {
    expect(scoreSurvey()).toEqual({ isCorrect: null, score: 1 });
  });

  it('derives session max score from ordered-sequence positions when partial credit is enabled', () => {
    const maxScore = getSessionMaxScore(
      {
        id: 'game-id',
        tenantId: 'tenant-id',
        name: 'Drift',
        slug: 'drift',
        mode: 'ordered_sequence',
        lifecycle: 'production',
        config: {
          roundsPerEdition: 1,
          partialCredit: true,
          shareEmojiCorrect: '🟩',
          shareEmojiIncorrect: '🟥',
          shareEmojiGame: '🧭',
          shareUrlTemplate: 'https://example.com/{slug}',
          allowAnonymous: true
        },
        active: true,
        createdAt: '2026-02-14T00:00:00Z',
        updatedAt: '2026-02-14T00:00:00Z'
      },
      [
        {
          id: 'round-id',
          editionId: 'edition-id',
          tenantId: 'tenant-id',
          position: 1,
          prompt: 'Sort these',
          options: [
            { key: 'a', label: 'Alpha' },
            { key: 'b', label: 'Beta' },
            { key: 'c', label: 'Gamma' }
          ],
          correctAnswer: { order: ['a', 'b', 'c'] },
          metadata: null,
          createdAt: '2026-02-14T00:00:00Z'
        }
      ]
    );

    expect(maxScore).toBe(3);
  });
});
