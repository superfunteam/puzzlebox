import { z } from 'zod';
import { AUTH_METHODS, EDITION_STATUSES, GAME_LIFECYCLES, GAME_MODES } from './constants';

export const gameModeSchema = z.enum(GAME_MODES);
export const gameLifecycleSchema = z.enum(GAME_LIFECYCLES);
export const editionStatusSchema = z.enum(EDITION_STATUSES);
export const authMethodSchema = z.enum(AUTH_METHODS);

export const optionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1)
});

export const gameConfigSchema = z.object({
  roundsPerEdition: z.number().int().min(1).max(25).default(5),
  partialCredit: z.boolean().default(true),
  shareEmojiCorrect: z.string().default('🟩'),
  shareEmojiIncorrect: z.string().default('🟥'),
  shareEmojiGame: z.string().default('🎯'),
  shareUrlTemplate: z.string().url(),
  allowAnonymous: z.boolean().default(true)
});

export const createGameSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  mode: gameModeSchema,
  lifecycle: gameLifecycleSchema.default('production'),
  config: gameConfigSchema
});

export const createEditionSchema = z.object({
  editionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: editionStatusSchema.default('draft'),
  publishAt: z.string().datetime().nullable().default(null),
  metadata: z.record(z.unknown()).nullable().default(null),
  rounds: z.array(
    z.object({
      position: z.number().int().min(1),
      prompt: z.string().min(1),
      options: z.array(optionSchema).min(2),
      correctAnswer: z.record(z.unknown()).nullable().default(null),
      metadata: z.record(z.unknown()).nullable().default(null)
    })
  )
});

export const answerSchema = z.union([
  z.object({ key: z.string().min(1) }),
  z.object({ order: z.array(z.string().min(1)).min(1) })
]);

export const createSessionSchema = z.object({
  editionId: z.string().uuid()
});

export const respondSchema = z.object({
  roundId: z.string().uuid(),
  answer: answerSchema
});
