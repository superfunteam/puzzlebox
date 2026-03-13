export const GAME_MODES = ['pick_one', 'ordered_sequence', 'survey'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const GAME_LIFECYCLES = ['playtest', 'production'] as const;
export type GameLifecycle = (typeof GAME_LIFECYCLES)[number];

export const GAME_SETUP_MODELS = ['free', 'paid'] as const;
export type GameSetupModel = (typeof GAME_SETUP_MODELS)[number];

export const GAME_LIFECYCLE_POLICY: Record<
  GameLifecycle,
  { maxUniquePlayers: number | null; setupModel: GameSetupModel }
> = {
  playtest: {
    maxUniquePlayers: 20,
    setupModel: 'free'
  },
  production: {
    maxUniquePlayers: null,
    setupModel: 'paid'
  }
} as const;

export const EDITION_STATUSES = ['draft', 'scheduled', 'active', 'archived'] as const;
export type EditionStatus = (typeof EDITION_STATUSES)[number];

export const AUTH_METHODS = ['magic_link', 'oauth', 'external', 'anonymous'] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export const DEFAULTS = {
  roundsPerEdition: 5,
  streakGraceHours: 3,
  sessionTtlHours: 24,
  respondRatePerMinute: 30
} as const;
