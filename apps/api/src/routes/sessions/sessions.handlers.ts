import { GAME_LIFECYCLE_POLICY } from '@puzzlebox/shared';
import { requirePlayer } from '../../lib/authz';
import { presentSession } from '../../lib/presenters';
import { store } from '../../lib/store';
import { getSessionMaxScore } from '../../services/scoring';
import { validateOrderedSequence } from '../../validation/ordered-sequence';
import { validatePickOne } from '../../validation/pick-one';
import { validateSurvey } from '../../validation/survey';
import { buildShareData } from '../../services/share';
import { updateStreak } from '../../services/streak';
import { getEnv } from '../../lib/env';

function getGameByEdition(tenantId: string, editionId: string) {
  return store.getGameByEdition(tenantId, editionId);
}

function sessionDurationSeconds(startedAt: string, completedAt: string | null): number {
  if (!completedAt) return 0;
  return Math.max(0, Math.round((new Date(completedAt).valueOf() - new Date(startedAt).valueOf()) / 1000));
}

function presentCompletion(input: {
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  score: number;
  maxScore: number;
  shareData: Record<string, unknown>;
  streak: { currentStreak: number; longestStreak: number; freezesRemaining: number };
}) {
  return {
    session_id: input.sessionId,
    score: input.score,
    max_score: input.maxScore,
    duration_seconds: sessionDurationSeconds(input.startedAt, input.completedAt),
    streak: {
      current: input.streak.currentStreak,
      longest: input.streak.longestStreak,
      is_new_record: input.streak.currentStreak === input.streak.longestStreak,
      freezes_remaining: input.streak.freezesRemaining
    },
    share_data: input.shareData
  };
}

export const sessionsHandlers = {
  async start(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const { edition_id: editionId } = c.req.valid('json');

    const edition = await store.getEdition(tenant.id, editionId);
    if (!edition) return c.json({ error: 'edition_not_found' }, 404);
    if (edition.status !== 'active') {
      return c.json(
        {
          error: 'edition_not_playable',
          status: edition.status
        },
        409
      );
    }

    const lookup = await getGameByEdition(tenant.id, editionId);
    if (!lookup) return c.json({ error: 'edition_game_not_found' }, 404);

    if (lookup.game.lifecycle === 'playtest') {
      const maxUniquePlayers = GAME_LIFECYCLE_POLICY.playtest.maxUniquePlayers;
      if (maxUniquePlayers !== null) {
        const currentUniquePlayers = await store.countUniquePlayersByGame(tenant.id, lookup.game.id);
        const hasPlayedGame = await store.hasPlayerSessionForGame(tenant.id, player.playerId, lookup.game.id);

        if (!hasPlayedGame && currentUniquePlayers >= maxUniquePlayers) {
          return c.json(
            {
              error: 'playtest_capacity_reached',
              max_unique_players: maxUniquePlayers,
              current_unique_players: currentUniquePlayers
            },
            403
          );
        }
      }
    }

    const created = await store.createSession(tenant.id, player.playerId, editionId);
    if (created.existing) {
      return c.json(
        {
          error: 'session_exists',
          existing_session: presentSession(created.existing, await store.getSessionResponses(tenant.id, created.existing.id))
        },
        409
      );
    }

    return c.json({ session_id: created.created!.id, started_at: created.created!.startedAt }, 201);
  },

  async getSession(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const session = await store.getSession(tenant.id, id);
    if (!session || session.playerId !== player.playerId) {
      return c.json({ error: 'not_found' }, 404);
    }

    const responses = await store.getSessionResponses(tenant.id, id);
    return c.json(presentSession(session, responses));
  },

  async respond(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const sessionId = c.req.param('id');
    const body = c.req.valid('json');

    const session = await store.getSession(tenant.id, sessionId);
    if (!session || session.playerId !== player.playerId) {
      return c.json({ error: 'session_not_found' }, 404);
    }
    if (session.completedAt) {
      return c.json({ error: 'session_completed' }, 409);
    }

    const round = await store.getRound(tenant.id, body.round_id);
    if (!round || round.editionId !== session.editionId) {
      return c.json({ error: 'round_not_in_session_edition' }, 422);
    }

    const lookup = await getGameByEdition(tenant.id, session.editionId);
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

    const created = await store.createOrGetResponse(tenant.id, {
      sessionId,
      roundId: round.id,
      answer: body.answer,
      isCorrect: validation.isCorrect,
      score: validation.score
    });

    const effective = created.created ?? created.existing!;

    if (lookup.game.mode === 'survey') {
      const allRoundResponses = (await store.listResponsesByTenant(tenant.id))
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

  async complete(c: any) {
    const playerAuth = requirePlayer(c);
    if (!playerAuth.ok) return playerAuth.response;

    const tenant = c.get('tenant');
    const sessionId = c.req.param('id');
    const session = await store.getSession(tenant.id, sessionId);
    if (!session || session.playerId !== playerAuth.playerId) {
      return c.json({ error: 'session_not_found' }, 404);
    }

    const lookup = await getGameByEdition(tenant.id, session.editionId);
    if (!lookup) return c.json({ error: 'edition_game_not_found' }, 404);

    const player = await store.getPlayer(tenant.id, playerAuth.playerId);
    if (!player) return c.json({ error: 'player_not_found' }, 404);

    const existingStreak = await store.getStreak(tenant.id, player.id, lookup.game.id);

    if (session.completedAt && session.score !== null && session.maxScore !== null && session.shareData !== null) {
      return c.json(
        presentCompletion({
          sessionId,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          score: session.score,
          maxScore: session.maxScore,
          shareData: session.shareData,
          streak: existingStreak
        })
      );
    }
    if (session.completedAt) {
      return c.json({ error: 'session_completed' }, 409);
    }

    const rounds = await store.listRounds(tenant.id, session.editionId);
    const responses = await store.getSessionResponses(tenant.id, sessionId);
    if (responses.length < rounds.length) {
      return c.json(
        {
          error: 'session_incomplete',
          answered_rounds: responses.length,
          total_rounds: rounds.length
        },
        409
      );
    }

    const score = responses.reduce((sum, response) => sum + response.score, 0);
    const maxScore = getSessionMaxScore(lookup.game, rounds);

    const updatedStreak = updateStreak({
      streak: existingStreak,
      player,
      tenant,
      graceHours: getEnv().streakGraceHours
    });
    await store.setStreak(updatedStreak);

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

    const finalized = await store.completeSession(tenant.id, sessionId, {
      score,
      maxScore,
      shareData
    });

    return c.json(
      presentCompletion({
        sessionId,
        startedAt: finalized?.startedAt ?? session.startedAt,
        completedAt: finalized?.completedAt ?? session.completedAt,
        score,
        maxScore,
        shareData,
        streak: updatedStreak
      })
    );
  }
};
