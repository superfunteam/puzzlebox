import type { AuthMethod, EditionStatus, GameLifecycle, GameMode } from '@puzzlebox/shared';

export interface PuzzleboxClientConfig {
  baseUrl: string;
  tenant: string;
  apiKey?: string;
  jwt?: string;
}

export interface RequestOptions {
  jwt?: string;
  apiKey?: string;
}

export interface PuzzleboxValidationIssue {
  path: Array<string | number>;
  message: string;
}

export interface PuzzleboxApiErrorPayload {
  error: string;
  details?: PuzzleboxValidationIssue[];
  [key: string]: unknown;
}

function errorMessage(status: number, payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  if (typeof payload === 'string' && payload.length > 0) {
    return payload;
  }

  return `HTTP ${status}`;
}

export class PuzzleboxApiError<TPayload = unknown> extends Error {
  readonly status: number;
  readonly payload: TPayload;

  constructor(status: number, payload: TPayload) {
    super(errorMessage(status, payload));
    this.name = 'PuzzleboxApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function isPuzzleboxApiError<TPayload = unknown>(error: unknown): error is PuzzleboxApiError<TPayload> {
  return error instanceof PuzzleboxApiError;
}

export type PuzzleboxLooseObject = Record<string, unknown>;

export interface PuzzleboxOption {
  key: string;
  label: string;
}

export interface PuzzleboxGameConfig {
  rounds_per_edition: number;
  partial_credit: boolean;
  share_emoji_correct: string;
  share_emoji_incorrect: string;
  share_emoji_game: string;
  share_url_template: string;
  allow_anonymous: boolean;
}

export interface PuzzleboxGamePolicy {
  max_unique_players: number | null;
  setup_model: 'free' | 'paid';
}

export interface PuzzleboxGame {
  id: string;
  slug: string;
  mode: GameMode;
  lifecycle: GameLifecycle;
  policy: PuzzleboxGamePolicy;
  name: string;
  active: boolean;
  config: PuzzleboxGameConfig;
}

export interface PuzzleboxPublicGame {
  slug: string;
  name: string;
  mode: GameMode;
  lifecycle: GameLifecycle;
  policy: PuzzleboxGamePolicy;
  has_today: boolean;
}

export type PuzzleboxGamesListItem = PuzzleboxGame | PuzzleboxPublicGame;

export interface PuzzleboxGamesListResponse {
  games: PuzzleboxGamesListItem[];
}

export interface CreateGameRequest {
  name: string;
  slug: string;
  mode: GameMode;
  lifecycle?: GameLifecycle;
  config: PuzzleboxGameConfig;
}

export interface PatchGameRequest {
  name?: string;
  active?: boolean;
  lifecycle?: GameLifecycle;
  config?: Partial<PuzzleboxGameConfig>;
}

export interface PuzzleboxRound {
  id: string;
  edition_id: string;
  position: number;
  prompt: string;
  options: PuzzleboxOption[];
  metadata: PuzzleboxLooseObject | null;
  created_at: string;
}

export interface PuzzleboxAdminRound extends PuzzleboxRound {
  correct_answer: PuzzleboxLooseObject | null;
}

export interface PuzzleboxEdition {
  id: string;
  game_id: string;
  edition_date: string;
  status: EditionStatus;
  publish_at: string | null;
  metadata: PuzzleboxLooseObject | null;
  created_at: string;
  updated_at: string;
}

export interface PuzzleboxEditionDetail extends PuzzleboxEdition {
  rounds: PuzzleboxAdminRound[];
}

export interface PuzzleboxEditionListResponse {
  editions: PuzzleboxEdition[];
}

export interface CreateRoundRequest {
  position: number;
  prompt: string;
  options: PuzzleboxOption[];
  correct_answer: PuzzleboxLooseObject | null;
  metadata?: PuzzleboxLooseObject | null;
}

export interface CreateEditionRequest {
  edition_date: string;
  status: EditionStatus;
  publish_at?: string | null;
  metadata?: PuzzleboxLooseObject | null;
  rounds: CreateRoundRequest[];
}

export interface CreateEditionResponse {
  id: string;
  edition_date: string;
  status: EditionStatus;
  round_count: number;
}

export type PuzzleboxAnswer = { key: string } | { order: string[] };

export interface PuzzleboxResponseRecord {
  id: string;
  session_id: string;
  round_id: string;
  answer: PuzzleboxAnswer;
  is_correct: boolean | null;
  score: number;
  responded_at: string;
}

export interface PuzzleboxShareData {
  game_name: string;
  game_emoji: string;
  edition_date: string;
  score: number;
  max_score: number;
  streak: number;
  per_round: Array<boolean | null>;
  share_text: string;
}

export interface PuzzleboxSession {
  id: string;
  player_id: string;
  edition_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  max_score: number | null;
  share_data: PuzzleboxShareData | null;
  responses: PuzzleboxResponseRecord[];
}

export interface PuzzleboxTodayResponse {
  edition_id: string;
  edition_date: string;
  game: {
    name: string;
    slug: string;
    mode: GameMode;
    lifecycle: GameLifecycle;
    policy: PuzzleboxGamePolicy;
  };
  rounds: PuzzleboxRound[];
  existing_session: PuzzleboxSession | null;
}

export interface AnonymousAuthResponse {
  player_id: string;
  jwt: string;
  anonymous: boolean;
  expires_at: string;
}

export interface StartSessionResponse {
  session_id: string;
  started_at: string;
}

export interface SessionExistsPayload {
  error: 'session_exists';
  existing_session: PuzzleboxSession;
}

export interface EditionNotPlayablePayload {
  error: 'edition_not_playable';
  status: EditionStatus;
}

export interface PlaytestCapacityPayload {
  error: 'playtest_capacity_reached';
  max_unique_players: number;
  current_unique_players: number;
}

export interface EvaluatedRoundResponse {
  is_correct: boolean;
  correct_answer: PuzzleboxLooseObject | null;
  score: number;
  metadata: PuzzleboxLooseObject | null;
  positions_correct?: boolean[];
}

export interface SurveyDistributionEntry {
  label: string;
  count: number;
  percentage: number;
}

export interface SurveyRoundResponse {
  is_correct: null;
  distribution: Record<string, SurveyDistributionEntry>;
  total_responses: number;
  your_answer: string;
}

export type RespondResponse = EvaluatedRoundResponse | SurveyRoundResponse;

export interface CompleteSessionResponse {
  session_id: string;
  score: number;
  max_score: number;
  duration_seconds: number;
  streak: {
    current: number;
    longest: number;
    is_new_record: boolean;
    freezes_remaining: number;
  };
  share_data: PuzzleboxShareData;
}

export interface PuzzleboxPlayer {
  id: string;
  auth_method: AuthMethod;
  email: string | null;
  external_id: string | null;
  display_name: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PuzzleboxPlayerListResponse {
  players: PuzzleboxPlayer[];
}

export interface PatchMeRequest {
  timezone?: string;
  display_name?: string;
}

export interface PuzzleboxPlayerStatsResponse {
  player_id: string;
  games: Array<{
    game_slug: string;
    total_sessions: number;
    current_streak: number;
    longest_streak: number;
    average_score_pct: number;
    last_played: string | null;
    freezes_remaining: number;
  }>;
}

export interface AnalyticsOverviewResponse {
  daily_active_players: number;
  total_sessions_today: number;
  games: Array<{
    slug: string;
    dap: number;
    completion_rate: number;
  }>;
}

export interface GameAnalyticsResponse {
  game_slug: string;
  daily_active_players: number;
  completion_rate: number;
  average_score_pct: number;
  share_rate: number;
  return_rate: number;
  streak_distribution: Record<string, number>;
  editions_count: number;
  total_sessions_all_time: number;
}

export interface EditionAnalyticsResponse {
  edition_id: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  average_score: number;
  max_possible_score: number;
  average_duration_seconds: number;
  per_round: Array<{
    round_id: string;
    position: number;
    accuracy: number;
    most_common_wrong: string | null;
  }>;
  score_distribution: Record<string, number>;
  completion_funnel: Record<string, number>;
  survey_distributions: PuzzleboxLooseObject | null;
}
