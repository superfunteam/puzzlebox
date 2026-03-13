import { store } from '../lib/store';
import { dateInTimezone } from '../lib/time';
import { getSessionMaxScore } from './scoring';

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export async function getOverview(tenantId: string) {
  const sessions = await store.listSessionsByTenant(tenantId);
  const tenant = await store.getTenant(tenantId);
  const timezone = tenant?.timezone ?? 'UTC';
  const today = dateInTimezone(new Date(), timezone);
  const todaySessions = sessions.filter((session) => dateInTimezone(new Date(session.startedAt), timezone) === today);
  const uniquePlayers = new Set(todaySessions.map((session) => session.playerId));
  const games = await store.listGames(tenantId, false);

  const gameRows = await Promise.all(
    games.map(async (game) => {
      const gameEditions = (await store.listEditionsByGame(tenantId, game.id)).map((edition) => edition.id);
      const gameSessions = sessions.filter((session) => gameEditions.includes(session.editionId));
      const completed = gameSessions.filter((session) => session.completedAt);

      return {
        slug: game.slug,
        dap: new Set(gameSessions.map((session) => session.playerId)).size,
        completion_rate: safeDivide(completed.length, gameSessions.length)
      };
    })
  );

  return {
    daily_active_players: uniquePlayers.size,
    total_sessions_today: todaySessions.length,
    games: gameRows
  };
}

export async function getGameAnalytics(tenantId: string, slug: string) {
  const game = await store.getGameBySlug(tenantId, slug);
  if (!game) return null;

  const editions = await store.listEditionsByGame(tenantId, game.id);
  const sessions = (await store.listSessionsByTenant(tenantId)).filter((session) =>
    editions.some((edition) => edition.id === session.editionId)
  );
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

export async function getEditionAnalytics(tenantId: string, editionId: string) {
  const edition = await store.getEdition(tenantId, editionId);
  if (!edition) return null;

  const lookup = await store.getGameByEdition(tenantId, editionId);
  if (!lookup) return null;

  const rounds = await store.listRounds(tenantId, editionId);
  const sessions = (await store.listSessionsByTenant(tenantId)).filter((session) => session.editionId === editionId);
  const responses = (await store.listResponsesByTenant(tenantId)).filter((response) =>
    sessions.some((session) => session.id === response.sessionId)
  );

  const completedSessions = sessions.filter((session) => session.completedAt !== null);
  const totalScore = completedSessions.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const averageDurationSeconds = safeDivide(
    completedSessions.reduce((sum, session) => {
      if (!session.completedAt) return sum;
      const duration = Math.max(
        0,
        Math.round((new Date(session.completedAt).valueOf() - new Date(session.startedAt).valueOf()) / 1000)
      );
      return sum + duration;
    }, 0),
    completedSessions.length
  );

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
    max_possible_score: getSessionMaxScore(lookup.game, rounds),
    average_duration_seconds: averageDurationSeconds,
    per_round: perRound,
    score_distribution: {},
    completion_funnel: {
      started: sessions.length,
      completed: completedSessions.length
    },
    survey_distributions: null
  };
}
