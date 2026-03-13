import type { Game } from '@puzzlebox/shared';
import { requireAdmin } from '../../lib/authz';
import { presentEdition, presentRound } from '../../lib/presenters';
import { store } from '../../lib/store';

function assertRoundCount(rounds: unknown[], expected: number) {
  if (rounds.length !== expected) {
    throw new Error('round_count_mismatch');
  }
}

interface RoundValidationShape {
  options: Array<{ key: string; label: string }>;
  correct_answer: Record<string, unknown> | null;
}

function validateRoundByMode(mode: Game['mode'], round: RoundValidationShape): boolean {
  const optionKeys = round.options.map((option) => option.key);
  const optionKeySet = new Set(optionKeys);
  const hasCorrect = round.correct_answer !== null && round.correct_answer !== undefined;

  if (mode === 'survey') {
    return !hasCorrect;
  }

  if (!hasCorrect) {
    return false;
  }

  if (mode === 'pick_one') {
    const key = round.correct_answer?.key;
    return typeof key === 'string' && optionKeySet.has(key);
  }

  const order = round.correct_answer?.order;
  if (!Array.isArray(order) || order.length !== optionKeys.length) {
    return false;
  }

  const normalizedOrder = order.map((value) => String(value));
  if (new Set(normalizedOrder).size !== normalizedOrder.length) {
    return false;
  }

  return normalizedOrder.every((key) => optionKeySet.has(key));
}

export const editionsHandlers = {
  async createEdition(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = await store.getGameBySlug(tenant.id, slug);
    if (!game) return c.json({ error: 'game_not_found' }, 404);

    const body = c.req.valid('json');

    try {
      assertRoundCount(body.rounds, game.config.roundsPerEdition);

      for (const round of body.rounds) {
        const hasCorrect = round.correct_answer !== null && round.correct_answer !== undefined;
        if (game.mode === 'survey' && hasCorrect) return c.json({ error: 'survey_round_cannot_have_correct_answer' }, 422);
        if (game.mode !== 'survey' && !hasCorrect) return c.json({ error: 'non_survey_round_requires_correct_answer' }, 422);
        if (!validateRoundByMode(game.mode, round)) return c.json({ error: 'invalid_correct_answer' }, 422);
      }

      const created = await store.createEdition(tenant.id, game.id, {
        editionDate: body.edition_date,
        status: body.status,
        publishAt: body.publish_at ?? null,
        metadata: body.metadata ?? null,
        rounds: body.rounds.map((round: any) => ({
          position: round.position,
          prompt: round.prompt,
          options: round.options,
          correctAnswer: round.correct_answer,
          metadata: round.metadata ?? null
        }))
      });

      return c.json(
        {
          id: created.edition.id,
          edition_date: created.edition.editionDate,
          status: created.edition.status,
          round_count: created.rounds.length
        },
        201
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'edition_exists') {
        return c.json({ error: 'edition_exists' }, 409);
      }
      if (error instanceof Error && error.message === 'round_count_mismatch') {
        return c.json({ error: 'round_count_mismatch' }, 422);
      }
      throw error;
    }
  },

  async listEditions(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = await store.getGameBySlug(tenant.id, slug);
    if (!game) return c.json({ error: 'game_not_found' }, 404);

    return c.json({ editions: (await store.listEditionsByGame(tenant.id, game.id)).map(presentEdition) });
  },

  async getEdition(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = await store.getEdition(tenant.id, id);
    if (!edition) return c.json({ error: 'not_found' }, 404);

    return c.json({
      ...presentEdition(edition),
      rounds: (await store.listRounds(tenant.id, edition.id)).map((round) => presentRound(round, { includeCorrectAnswer: true }))
    });
  },

  async patchEdition(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const body = c.req.valid('json');

    const edition = await store.patchEdition(tenant.id, id, {
      status: body.status,
      metadata: body.metadata,
      publishAt: body.publish_at
    });

    if (!edition) return c.json({ error: 'not_found' }, 404);
    return c.json(presentEdition(edition));
  },

  async publishEdition(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = await store.patchEdition(tenant.id, id, { status: 'active' });
    if (!edition) return c.json({ error: 'not_found' }, 404);
    return c.json(presentEdition(edition));
  },

  async archiveEdition(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = await store.patchEdition(tenant.id, id, { status: 'archived' });
    if (!edition) return c.json({ error: 'not_found' }, 404);
    return c.json(presentEdition(edition));
  },

  async listRounds(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = await store.getEdition(tenant.id, id);
    if (!edition) return c.json({ error: 'not_found' }, 404);

    return c.json({ rounds: (await store.listRounds(tenant.id, edition.id)).map((round) => presentRound(round, { includeCorrectAnswer: true })) });
  },

  async patchRound(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const body = c.req.valid('json');

    const round = await store.getRound(tenant.id, id);
    if (!round) return c.json({ error: 'not_found' }, 404);

    const edition = await store.getEdition(tenant.id, round.editionId);
    if (!edition || edition.status !== 'draft') {
      return c.json({ error: 'round_mutation_requires_draft_edition' }, 409);
    }

    const game = await store.getGameById(tenant.id, edition.gameId);
    if (!game) return c.json({ error: 'edition_game_not_found' }, 404);

    const effectiveRound: RoundValidationShape = {
      options: body.options ?? round.options,
      correct_answer: body.correct_answer !== undefined ? body.correct_answer : round.correctAnswer
    };

    const hasCorrect = effectiveRound.correct_answer !== null && effectiveRound.correct_answer !== undefined;
    if (game.mode === 'survey' && hasCorrect) return c.json({ error: 'survey_round_cannot_have_correct_answer' }, 422);
    if (game.mode !== 'survey' && !hasCorrect) return c.json({ error: 'non_survey_round_requires_correct_answer' }, 422);
    if (!validateRoundByMode(game.mode, effectiveRound)) return c.json({ error: 'invalid_correct_answer' }, 422);

    const updated = await store.patchRound(tenant.id, id, {
      prompt: body.prompt,
      options: body.options,
      correctAnswer: body.correct_answer,
      metadata: body.metadata
    });
    if (!updated) return c.json({ error: 'not_found' }, 404);

    return c.json(presentRound(updated, { includeCorrectAnswer: true }));
  },

  async deleteRound(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const round = await store.getRound(tenant.id, id);
    if (!round) return c.json({ error: 'not_found' }, 404);

    const edition = await store.getEdition(tenant.id, round.editionId);
    if (!edition || edition.status !== 'draft') {
      return c.json({ error: 'round_mutation_requires_draft_edition' }, 409);
    }

    await store.deleteRound(tenant.id, id);
    return c.json({ id, deleted: true });
  }
};
