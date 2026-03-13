import { GAME_LIFECYCLE_POLICY, type GameLifecycle } from './constants';
import type { GameConfig, GamePolicy } from './types';

export const DEFAULT_GAME_CONFIG: Readonly<GameConfig> = Object.freeze({
  roundsPerEdition: 5,
  partialCredit: true,
  shareEmojiCorrect: '🟩',
  shareEmojiIncorrect: '🟥',
  shareEmojiGame: '🎯',
  shareUrlTemplate: 'https://example.com/{slug}',
  allowAnonymous: true
});

export function normalizeGameConfig(input: Partial<GameConfig>): GameConfig {
  return {
    ...DEFAULT_GAME_CONFIG,
    ...input
  };
}

export function getGamePolicy(lifecycle: GameLifecycle): GamePolicy {
  const policy = GAME_LIFECYCLE_POLICY[lifecycle];

  return {
    maxUniquePlayers: policy.maxUniquePlayers,
    setupModel: policy.setupModel
  };
}
