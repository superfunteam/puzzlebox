export const GAME_MODES = ['pick_one', 'ordered_sequence', 'survey'] as const;
export type GameMode = (typeof GAME_MODES)[number];

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
