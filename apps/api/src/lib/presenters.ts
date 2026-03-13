import type { Edition, Game, GameConfig, Player, ResponseRecord, Round, Session } from '@puzzlebox/shared';
import { getGamePolicy } from '@puzzlebox/shared';

function presentGameConfig(config: GameConfig) {
  return {
    rounds_per_edition: config.roundsPerEdition,
    partial_credit: config.partialCredit,
    share_emoji_correct: config.shareEmojiCorrect,
    share_emoji_incorrect: config.shareEmojiIncorrect,
    share_emoji_game: config.shareEmojiGame,
    share_url_template: config.shareUrlTemplate,
    allow_anonymous: config.allowAnonymous
  };
}

function presentGamePolicy(lifecycle: Game['lifecycle']) {
  const policy = getGamePolicy(lifecycle);

  return {
    max_unique_players: policy.maxUniquePlayers,
    setup_model: policy.setupModel
  };
}

export function presentGame(game: Game) {
  return {
    id: game.id,
    slug: game.slug,
    mode: game.mode,
    lifecycle: game.lifecycle,
    policy: presentGamePolicy(game.lifecycle),
    name: game.name,
    active: game.active,
    config: presentGameConfig(game.config)
  };
}

export function presentPublicGame(game: Game, hasToday: boolean) {
  return {
    slug: game.slug,
    name: game.name,
    mode: game.mode,
    lifecycle: game.lifecycle,
    policy: presentGamePolicy(game.lifecycle),
    has_today: hasToday
  };
}

export function presentEdition(edition: Edition) {
  return {
    id: edition.id,
    game_id: edition.gameId,
    edition_date: edition.editionDate,
    status: edition.status,
    publish_at: edition.publishAt,
    metadata: edition.metadata,
    created_at: edition.createdAt,
    updated_at: edition.updatedAt
  };
}

export function presentRound(round: Round, options: { includeCorrectAnswer?: boolean } = {}) {
  const base = {
    id: round.id,
    edition_id: round.editionId,
    position: round.position,
    prompt: round.prompt,
    options: round.options,
    metadata: round.metadata,
    created_at: round.createdAt
  };

  if (!options.includeCorrectAnswer) {
    return base;
  }

  return {
    ...base,
    correct_answer: round.correctAnswer
  };
}

export function presentResponse(response: ResponseRecord) {
  return {
    id: response.id,
    session_id: response.sessionId,
    round_id: response.roundId,
    answer: response.answer,
    is_correct: response.isCorrect,
    score: response.score,
    responded_at: response.respondedAt
  };
}

export function presentSession(session: Session, responses: ResponseRecord[] = []) {
  return {
    id: session.id,
    player_id: session.playerId,
    edition_id: session.editionId,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    score: session.score,
    max_score: session.maxScore,
    share_data: session.shareData,
    responses: responses.map(presentResponse)
  };
}

export function presentPlayer(player: Player) {
  return {
    id: player.id,
    auth_method: player.authMethod,
    email: player.email,
    external_id: player.externalId,
    display_name: player.displayName,
    timezone: player.timezone,
    created_at: player.createdAt,
    updated_at: player.updatedAt
  };
}
