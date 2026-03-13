import { z } from '@hono/zod-openapi';
import { AUTH_METHODS, EDITION_STATUSES, GAME_LIFECYCLES, GAME_MODES } from '@puzzlebox/shared';

export const uuidSchema = z.string().uuid();
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const isoDateTimeSchema = z.string().datetime();
export const looseObjectSchema = z.record(z.string(), z.unknown()).openapi('LooseObject');

export const optionSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1)
  })
  .openapi('Option');

export const gameModeSchema = z.enum(GAME_MODES).openapi('GameMode');
export const gameLifecycleSchema = z.enum(GAME_LIFECYCLES).openapi('GameLifecycle');
export const editionStatusSchema = z.enum(EDITION_STATUSES).openapi('EditionStatus');
export const authMethodSchema = z.enum(AUTH_METHODS).openapi('AuthMethod');

export const apiErrorSchema = z
  .object({
    error: z.string()
  })
  .openapi('ApiError');

export const validationIssueSchema = z
  .object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string()
  })
  .openapi('ValidationIssue');

export const validationErrorSchema = apiErrorSchema
  .extend({
    details: z.array(validationIssueSchema)
  })
  .openapi('ValidationError');

export const deleteResponseSchema = z
  .object({
    id: uuidSchema,
    deleted: z.boolean()
  })
  .openapi('DeleteResponse');

export const gameConfigSchema = z
  .object({
    rounds_per_edition: z.number().int().min(1).max(25),
    partial_credit: z.boolean(),
    share_emoji_correct: z.string(),
    share_emoji_incorrect: z.string(),
    share_emoji_game: z.string(),
    share_url_template: z.string().url(),
    allow_anonymous: z.boolean()
  })
  .openapi('GameConfig');

export const gameConfigPatchSchema = gameConfigSchema.partial().openapi('PatchGameConfig');

export const gamePolicySchema = z
  .object({
    max_unique_players: z.number().int().nullable(),
    setup_model: z.enum(['free', 'paid'])
  })
  .openapi('GamePolicy');

export const gameSchema = z
  .object({
    id: uuidSchema,
    slug: z.string(),
    mode: gameModeSchema,
    lifecycle: gameLifecycleSchema,
    policy: gamePolicySchema,
    name: z.string(),
    active: z.boolean(),
    config: gameConfigSchema
  })
  .openapi('Game');

export const publicGameSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    mode: gameModeSchema,
    lifecycle: gameLifecycleSchema,
    policy: gamePolicySchema,
    has_today: z.boolean()
  })
  .openapi('PublicGame');

export const gamesListResponseSchema = z
  .object({
    games: z.array(z.union([gameSchema, publicGameSchema]))
  })
  .openapi('GamesListResponse');

export const createGameRequestSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    mode: gameModeSchema,
    lifecycle: gameLifecycleSchema.optional(),
    config: gameConfigSchema
  })
  .openapi('CreateGameRequest');

export const patchGameRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    active: z.boolean().optional(),
    lifecycle: gameLifecycleSchema.optional(),
    config: gameConfigPatchSchema.optional()
  })
  .openapi('PatchGameRequest');

export const roundCreateSchema = z
  .object({
    position: z.number().int().min(1),
    prompt: z.string().min(1),
    options: z.array(optionSchema).min(2),
    correct_answer: looseObjectSchema.nullable(),
    metadata: looseObjectSchema.nullable().optional()
  })
  .openapi('CreateRoundRequest');

export const roundSchema = z
  .object({
    id: uuidSchema,
    edition_id: uuidSchema,
    position: z.number().int().min(1),
    prompt: z.string(),
    options: z.array(optionSchema),
    metadata: looseObjectSchema.nullable(),
    created_at: isoDateTimeSchema
  })
  .openapi('Round');

export const roundAdminSchema = roundSchema
  .extend({
    correct_answer: looseObjectSchema.nullable()
  })
  .openapi('AdminRound');

export const editionSchema = z
  .object({
    id: uuidSchema,
    game_id: uuidSchema,
    edition_date: isoDateSchema,
    status: editionStatusSchema,
    publish_at: isoDateTimeSchema.nullable(),
    metadata: looseObjectSchema.nullable(),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema
  })
  .openapi('Edition');

export const editionDetailSchema = editionSchema
  .extend({
    rounds: z.array(roundAdminSchema)
  })
  .openapi('EditionDetail');

export const editionListResponseSchema = z
  .object({
    editions: z.array(editionSchema)
  })
  .openapi('EditionListResponse');

export const createEditionRequestSchema = z
  .object({
    edition_date: isoDateSchema,
    status: editionStatusSchema,
    publish_at: isoDateTimeSchema.nullable().optional(),
    metadata: looseObjectSchema.nullable().optional(),
    rounds: z.array(roundCreateSchema).min(1)
  })
  .openapi('CreateEditionRequest');

export const createEditionResponseSchema = z
  .object({
    id: uuidSchema,
    edition_date: isoDateSchema,
    status: editionStatusSchema,
    round_count: z.number().int().min(0)
  })
  .openapi('CreateEditionResponse');

export const patchEditionRequestSchema = z
  .object({
    status: editionStatusSchema.optional(),
    publish_at: isoDateTimeSchema.nullable().optional(),
    metadata: looseObjectSchema.nullable().optional()
  })
  .openapi('PatchEditionRequest');

export const roundPatchRequestSchema = z
  .object({
    prompt: z.string().min(1).optional(),
    options: z.array(optionSchema).min(2).optional(),
    correct_answer: looseObjectSchema.nullable().optional(),
    metadata: looseObjectSchema.nullable().optional()
  })
  .openapi('PatchRoundRequest');

export const answerSchema = z
  .union([
    z.object({ key: z.string().min(1) }),
    z.object({ order: z.array(z.string().min(1)).min(1) })
  ])
  .openapi('Answer');

export const responseRecordSchema = z
  .object({
    id: uuidSchema,
    session_id: uuidSchema,
    round_id: uuidSchema,
    answer: answerSchema,
    is_correct: z.boolean().nullable(),
    score: z.number().int().min(0),
    responded_at: isoDateTimeSchema
  })
  .openapi('ResponseRecord');

export const shareDataSchema = z
  .object({
    game_name: z.string(),
    game_emoji: z.string(),
    edition_date: isoDateSchema,
    score: z.number().int().min(0),
    max_score: z.number().int().min(0),
    streak: z.number().int().min(0),
    per_round: z.array(z.boolean().nullable()),
    share_text: z.string()
  })
  .openapi('ShareData');

export const sessionStateSchema = z
  .object({
    id: uuidSchema,
    player_id: uuidSchema,
    edition_id: uuidSchema,
    started_at: isoDateTimeSchema,
    completed_at: isoDateTimeSchema.nullable(),
    score: z.number().int().min(0).nullable(),
    max_score: z.number().int().min(0).nullable(),
    share_data: shareDataSchema.nullable(),
    responses: z.array(responseRecordSchema)
  })
  .openapi('SessionState');

export const todayResponseSchema = z
  .object({
    edition_id: uuidSchema,
    edition_date: isoDateSchema,
    game: z.object({
      name: z.string(),
      slug: z.string(),
      mode: gameModeSchema,
      lifecycle: gameLifecycleSchema,
      policy: gamePolicySchema
    }),
    rounds: z.array(roundSchema),
    existing_session: sessionStateSchema.nullable()
  })
  .openapi('TodayResponse');

export const startSessionRequestSchema = z
  .object({
    edition_id: uuidSchema
  })
  .openapi('StartSessionRequest');

export const startSessionResponseSchema = z
  .object({
    session_id: uuidSchema,
    started_at: isoDateTimeSchema
  })
  .openapi('StartSessionResponse');

export const sessionExistsSchema = z
  .object({
    error: z.literal('session_exists'),
    existing_session: sessionStateSchema
  })
  .openapi('SessionExistsError');

export const playtestCapacitySchema = z
  .object({
    error: z.literal('playtest_capacity_reached'),
    max_unique_players: z.number().int(),
    current_unique_players: z.number().int()
  })
  .openapi('PlaytestCapacityError');

export const editionNotPlayableSchema = z
  .object({
    error: z.literal('edition_not_playable'),
    status: editionStatusSchema
  })
  .openapi('EditionNotPlayableError');

export const respondRequestSchema = z
  .object({
    round_id: uuidSchema,
    answer: answerSchema
  })
  .openapi('RespondRequest');

export const evaluatedResponseSchema = z
  .object({
    is_correct: z.boolean(),
    correct_answer: looseObjectSchema.nullable(),
    score: z.number().int().min(0),
    metadata: looseObjectSchema.nullable(),
    positions_correct: z.array(z.boolean()).optional()
  })
  .openapi('EvaluatedRoundResponse');

export const surveyDistributionEntrySchema = z
  .object({
    label: z.string(),
    count: z.number().int().min(0),
    percentage: z.number().min(0)
  })
  .openapi('SurveyDistributionEntry');

export const surveyResponseSchema = z
  .object({
    is_correct: z.null(),
    distribution: z.record(z.string(), surveyDistributionEntrySchema),
    total_responses: z.number().int().min(0),
    your_answer: z.string()
  })
  .openapi('SurveyRoundResponse');

export const respondResponseSchema = z
  .union([evaluatedResponseSchema, surveyResponseSchema])
  .openapi('RespondResponse');

export const completeSessionResponseSchema = z
  .object({
    session_id: uuidSchema,
    score: z.number().int().min(0),
    max_score: z.number().int().min(0),
    duration_seconds: z.number().int().min(0),
    streak: z.object({
      current: z.number().int().min(0),
      longest: z.number().int().min(0),
      is_new_record: z.boolean(),
      freezes_remaining: z.number().int().min(0)
    }),
    share_data: shareDataSchema
  })
  .openapi('CompleteSessionResponse');

export const playerSchema = z
  .object({
    id: uuidSchema,
    auth_method: authMethodSchema,
    email: z.string().email().nullable(),
    external_id: z.string().nullable(),
    display_name: z.string().nullable(),
    timezone: z.string().nullable(),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema
  })
  .openapi('Player');

export const playerListResponseSchema = z
  .object({
    players: z.array(playerSchema)
  })
  .openapi('PlayerListResponse');

export const playerStatsSchema = z
  .object({
    player_id: uuidSchema,
    games: z.array(
      z.object({
        game_slug: z.string(),
        total_sessions: z.number().int().min(0),
        current_streak: z.number().int().min(0),
        longest_streak: z.number().int().min(0),
        average_score_pct: z.number().min(0),
        last_played: isoDateSchema.nullable(),
        freezes_remaining: z.number().int().min(0)
      })
    )
  })
  .openapi('PlayerStats');

export const patchMeRequestSchema = z
  .object({
    timezone: z.string().optional(),
    display_name: z.string().optional()
  })
  .openapi('PatchMeRequest');

export const analyticsOverviewSchema = z
  .object({
    daily_active_players: z.number().int().min(0),
    total_sessions_today: z.number().int().min(0),
    games: z.array(
      z.object({
        slug: z.string(),
        dap: z.number().int().min(0),
        completion_rate: z.number().min(0)
      })
    )
  })
  .openapi('AnalyticsOverview');

export const gameAnalyticsSchema = z
  .object({
    game_slug: z.string(),
    daily_active_players: z.number().int().min(0),
    completion_rate: z.number().min(0),
    average_score_pct: z.number().min(0),
    share_rate: z.number().min(0),
    return_rate: z.number().min(0),
    streak_distribution: z.record(z.string(), z.number().int().min(0)),
    editions_count: z.number().int().min(0),
    total_sessions_all_time: z.number().int().min(0)
  })
  .openapi('GameAnalytics');

export const editionAnalyticsSchema = z
  .object({
    edition_id: uuidSchema,
    total_sessions: z.number().int().min(0),
    completed_sessions: z.number().int().min(0),
    completion_rate: z.number().min(0),
    average_score: z.number().min(0),
    max_possible_score: z.number().int().min(0),
    average_duration_seconds: z.number().min(0),
    per_round: z.array(
      z.object({
        round_id: uuidSchema,
        position: z.number().int().min(1),
        accuracy: z.number().min(0),
        most_common_wrong: z.string().nullable()
      })
    ),
    score_distribution: z.record(z.string(), z.number().int().min(0)),
    completion_funnel: z.record(z.string(), z.number().int().min(0)),
    survey_distributions: looseObjectSchema.nullable()
  })
  .openapi('EditionAnalytics');
