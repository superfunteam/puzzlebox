import { requirePlayer } from '../../lib/authz';
import { store } from '../../lib/store';
import { validateOrderedSequence } from '../../validation/ordered-sequence';
import { validatePickOne } from '../../validation/pick-one';
import { validateSurvey } from '../../validation/survey';
import { buildShareData } from '../../services/share';
import { updateStreak } from '../../services/streak';
import { getEnv } from '../../lib/env';

function getGameByEdition(tenantId: string, editionId: string) {
  const edition = store.getEdition(tenantId, editionId);
  if (!edition) return null;
  const games = store.listGames(tenantId);
  const game = games.find((candidate) => candidate.id === edition.gameId) ?? null;
  if (!game) return null;
  return { game, edition };
}

export const sessionsHandlers = {
  start(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const { edition_id: editionId } = c.req.valid('json');

    const edition = store.getEdition(tenant.id, editionId);
    if (!edition) return c.json({ error: 'edition_not_found' }, 404);

    const created = store.createSession(tenant.id, player.playerId, editionId);
    if (created.existing) {
      return c.json({ error: 'session_exists', existing_session: created.existing }, 409);
    }

    return c.json({ session_id: created.created!.id, started_at: created.created!.startedAt }, 201);
  },

  getSession(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const session = store.getSession(tenant.id, id);
    if (!session || session.playerId !== player.playerId) {
      return c.json({ error: 'not_found' }, 404);
    }

    const responses = store.getSessionResponses(tenant.id, id);
    return c.json({ ...session, responses });
  },

  respond(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const sessionId = c.req.param('id');
    const body = c.req.valid('json');

    const session = store.getSession(tenant.id, sessionId);
    if (!session || session.playerId !== player.playerId) {
      return c.json({ error: 'session_not_found' }, 404);
    }

    const round = store.getRound(tenant.id, body.round_id);
    if (!round || round.editionId !== session.editionId) {
      return c.json({ error: 'round_not_in_session_edition' }, 422);
    }

    const lookup = getGameByEdition(tenant.id, session.editionId);
    if (!lookup) {
      return c.json({ error: 'edition_game_not_found' }, 404);
    }

    let validation;
    try {
      if (lookup.game.mode === 'pick_one') {
        validation = validatePickOne(round, body.answer);
      } else if (lookup.game.mode === 'ordered_sequence') {
        validation = validateOrderedSequence(round, body.answer, lookup.game.config.partialCredit);
      } else {
        validation = validateSurvey(round, body.answer);
      }
    } catch (error) {
      if (error instanceof Error) return c.json({ error: error.message }, 422);
      throw error;
    }

    const created = store.createOrGetResponse(tenant.id, {
      sessionId,
      roundId: round.id,
      answer: body.answer,
      isCorrect: validation.isCorrect,
      score: validation.score
    });

    const effective = created.created ?? created.existing!;

    if (lookup.game.mode === 'survey') {
      const allRoundResponses = store
        .listResponsesByTenant(tenant.id)
        .filter((response) => response.roundId === round.id);

      const counts: Record<string, number> = {};
      for (const option of round.options) counts[option.key] = 0;
      for (const response of allRoundResponses) {
        const answerKey = String(response.answer.key ?? '');
        if (answerKey in counts) counts[answerKey] = (counts[answerKey] ?? 0) + 1;
      }
      const total = allRoundResponses.length;

      const distribution = Object.fromEntries(
        round.options.map((option: { key: string; label: string }) => [
          option.key,
          {
            label: option.label,
            count: counts[option.key] ?? 0,
            percentage: total === 0 ? 0 : (counts[option.key] ?? 0) / total
          }
        ])
      );

      return c.json({
        is_correct: null,
        distribution,
        total_responses: total,
        your_answer: String(effective.answer.key ?? '')
      });
    }

    const payload: Record<string, unknown> = {
      is_correct: effective.isCorrect,
      correct_answer: round.correctAnswer,
      score: effective.score,
      metadata: round.metadata
    };

    if (validation.positionsCorrect) {
      payload.positions_correct = validation.positionsCorrect;
    }

    return c.json(payload);
  },

  complete(c: any) {
    const playerAuth = requirePlayer(c);
    if (!playerAuth.ok) return playerAuth.response;

    const tenant = c.get('tenant');
    const sessionId = c.req.param('id');
    const session = store.getSession(tenant.id, sessionId);
    if (!session || session.playerId !== playerAuth.playerId) {
      return c.json({ error: 'session_not_found' }, 404);
    }

    const lookup = getGameByEdition(tenant.id, session.editionId);
    if (!lookup) return c.json({ error: 'edition_game_not_found' }, 404);

    const rounds = store.listRounds(tenant.id, session.editionId);
    const responses = store.getSessionResponses(tenant.id, sessionId);
    const score = responses.reduce((sum, response) => sum + response.score, 0);
    const maxScore = rounds.length;

    const player = store.getPlayer(tenant.id, playerAuth.playerId);
    if (!player) return c.json({ error: 'player_not_found' }, 404);

    const streak = store.getStreak(tenant.id, player.id, lookup.game.id);
    const updatedStreak = updateStreak({
      streak,
      player,
      tenant,
      graceHours: getEnv().streakGraceHours
    });
    store.setStreak(updatedStreak);

    const perRound: Array<boolean | null> = rounds.map((round) => {
      const response = responses.find((item) => item.roundId === round.id);
      if (!response) return null;
      return response.isCorrect;
    });

    const shareData = buildShareData({
      game: lookup.game,
      editionDate: lookup.edition.editionDate,
      score,
      maxScore,
      streak: updatedStreak.currentStreak,
      perRound
    });

    const finalized = store.completeSession(tenant.id, sessionId, {
      score,
      maxScore,
      shareData
    });

    return c.json({
      session_id: sessionId,
      score,
      max_score: maxScore,
      duration_seconds: finalized?.completedAt
        ? Math.max(0, Math.round((new Date(finalized.completedAt).valueOf() - new Date(finalized.startedAt).valueOf()) / 1000))
        : 0,
      streak: {
        current: updatedStreak.currentStreak,
        longest: updatedStreak.longestStreak,
        is_new_record: updatedStreak.currentStreak === updatedStreak.longestStreak,
        freezes_remaining: updatedStreak.freezesRemaining
      },
      share_data: shareData
    });
  }
};
