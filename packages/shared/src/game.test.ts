import { describe, expect, it } from 'vitest';
import { getGamePolicy, normalizeGameConfig } from './game';

describe('game helpers', () => {
  it('fills missing game config fields without dropping provided values', () => {
    const config = normalizeGameConfig({
      roundsPerEdition: 7,
      shareUrlTemplate: 'https://play.example.com/{slug}'
    });

    expect(config).toEqual({
      roundsPerEdition: 7,
      partialCredit: true,
      shareEmojiCorrect: '🟩',
      shareEmojiIncorrect: '🟥',
      shareEmojiGame: '🎯',
      shareUrlTemplate: 'https://play.example.com/{slug}',
      allowAnonymous: true
    });
  });

  it('returns the documented game policy for each lifecycle', () => {
    expect(getGamePolicy('playtest')).toEqual({
      maxUniquePlayers: 20,
      setupModel: 'free'
    });
    expect(getGamePolicy('production')).toEqual({
      maxUniquePlayers: null,
      setupModel: 'paid'
    });
  });
});
