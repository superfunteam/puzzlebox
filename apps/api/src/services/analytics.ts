import { store } from '../lib/store';
import { dateInTimezone } from '../lib/time';

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function getOverview(tenantId: string) {
  const sessions = store.listSessionsByTenant(tenantId);
  const tenant = store.getTenant(tenantId);
  const timezone = tenant?.timezone ?? 'UTC';
  const today = dateInTimezone(new Date(), timezone);
  const todaySessions = sessions.filter((session) => dateInTimezone(new Date(session.startedAt), timezone) === today);
  const uniquePlayers = new Set(todaySessions.map((session) => session.playerId));

  return {
    daily_active_players: uniquePlayers.size,
    total_sessions_today: todaySessions.length,
    games: store.listGames(tenantId, false).map((game) => {
      const gameEditions = store.listEditionsByGame(tenantId, game.id).map((edition) => edition.id);
      const gameSessions = sessions.filter((session) => gameEditions.includes(session.editionId));
      const completed = gameSessions.filter((session) => session.completedAt);

      return {
        slug: game.slug,
        dap: new Set(gameSessions.map((session) => session.playerId)).size,
        completion_rate: safeDivide(completed.length, gameSessions.length)
      };
    })
  };
}

export function getGameAnalytics(tenantId: string, slug: string) {
  const game = store.getGameBySlug(tenantId, slug);
  if (!game) return null;

  const editions = store.listEditionsByGame(tenantId, game.id);
  const sessions = store
    .listSessionsByTenant(tenantId)
    .filter((session) => editions.some((edition) => edition.id === session.editionId));
  const completed = sessions.filter((session) => session.completedAt !== null);

  const averageScorePct = safeDivide(
    completed.reduce((sum, item) => sum + (item.score ?? 0), 0),
    completed.reduce((sum, item) => sum + (item.maxScore ?? 0), 0)
  );

  return {
    game_slug: slug,
    daily_active_players: new Set(sessions.map((session) => session.playerId)).size,
    completion_rate: safeDivide(completed.length, sessions.length),
    average_score_pct: averageScorePct,
    share_rate: safeDivide(completed.filter((session) => session.shareData).length, completed.length),
    return_rate: safeDivide(new Set(sessions.map((session) => session.playerId)).size, sessions.length),
    streak_distribution: {
      '1': 0,
      '2-3': 0,
      '4-7': 0,
      '8-14': 0,
      '15-30': 0,
      '30+': 0
    },
    editions_count: editions.length,
    total_sessions_all_time: sessions.length
  };
}

export function getEditionAnalytics(tenantId: string, editionId: string) {
  const edition = store.getEdition(tenantId, editionId);
  if (!edition) return null;

  const rounds = store.listRounds(tenantId, editionId);
  const sessions = store.listSessionsByTenant(tenantId).filter((session) => session.editionId === editionId);
  const responses = store.listResponsesByTenant(tenantId).filter((response) => sessions.some((session) => session.id === response.sessionId));

  const completedSessions = sessions.filter((session) => session.completedAt !== null);
  const totalScore = completedSessions.reduce((sum, item) => sum + (item.score ?? 0), 0);

  const perRound = rounds.map((round) => {
    const roundResponses = responses.filter((response) => response.roundId === round.id);
    const correctResponses = roundResponses.filter((response) => response.isCorrect === true);

    return {
      round_id: round.id,
      position: round.position,
      accuracy: safeDivide(correctResponses.length, roundResponses.length),
      most_common_wrong: null
    };
  });

  return {
    edition_id: editionId,
    total_sessions: sessions.length,
    completed_sessions: completedSessions.length,
    completion_rate: safeDivide(completedSessions.length, sessions.length),
    average_score: safeDivide(totalScore, completedSessions.length),
    max_possible_score: rounds.length,
    average_duration_seconds: 0,
    per_round: perRound,
    score_distribution: {},
    completion_funnel: {
      started: sessions.length
    },
    survey_distributions: null
  };
}
