import type { AuthMethod, EditionStatus, GameLifecycle, GameMode, GameSetupModel } from './constants';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  authConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GameConfig {
  roundsPerEdition: number;
  partialCredit: boolean;
  shareEmojiCorrect: string;
  shareEmojiIncorrect: string;
  shareEmojiGame: string;
  shareUrlTemplate: string;
  allowAnonymous: boolean;
}

export interface Game {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  mode: GameMode;
  lifecycle: GameLifecycle;
  config: GameConfig;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GamePolicy {
  maxUniquePlayers: number | null;
  setupModel: GameSetupModel;
}

export interface Edition {
  id: string;
  gameId: string;
  tenantId: string;
  editionDate: string;
  status: EditionStatus;
  publishAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  editionId: string;
  tenantId: string;
  position: number;
  prompt: string;
  options: Array<{ key: string; label: string }>;
  correctAnswer: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Player {
  id: string;
  tenantId: string;
  authMethod: AuthMethod;
  email: string | null;
  externalId: string | null;
  displayName: string | null;
  anonymousToken: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  playerId: string;
  editionId: string;
  tenantId: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  maxScore: number | null;
  shareData: Record<string, unknown> | null;
}

export interface ResponseRecord {
  id: string;
  sessionId: string;
  roundId: string;
  tenantId: string;
  answer: Record<string, unknown>;
  isCorrect: boolean | null;
  score: number;
  respondedAt: string;
}

export interface PlayerStreak {
  playerId: string;
  gameId: string;
  tenantId: string;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  freezesRemaining: number;
  updatedAt: string;
}
