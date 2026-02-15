import { requireAdmin } from '../../lib/authz';
import { store } from '../../lib/store';

function assertRoundCount(rounds: unknown[], expected: number) {
  if (rounds.length !== expected) {
    throw new Error('round_count_mismatch');
  }
}

export const editionsHandlers = {
  createEdition(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = store.getGameBySlug(tenant.id, slug);
    if (!game) return c.json({ error: 'game_not_found' }, 404);

    const body = c.req.valid('json');

    try {
      assertRoundCount(body.rounds, game.config.roundsPerEdition);

      for (const round of body.rounds) {
        const hasCorrect = round.correct_answer !== null && round.correct_answer !== undefined;
        if (game.mode === 'survey' && hasCorrect) return c.json({ error: 'survey_round_cannot_have_correct_answer' }, 422);
        if (game.mode !== 'survey' && !hasCorrect) return c.json({ error: 'non_survey_round_requires_correct_answer' }, 422);
      }

      const created = store.createEdition(tenant.id, game.id, {
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

  listEditions(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = store.getGameBySlug(tenant.id, slug);
    if (!game) return c.json({ error: 'game_not_found' }, 404);

    return c.json({ editions: store.listEditionsByGame(tenant.id, game.id) });
  },

  getEdition(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = store.getEdition(tenant.id, id);
    if (!edition) return c.json({ error: 'not_found' }, 404);

    return c.json({ ...edition, rounds: store.listRounds(tenant.id, edition.id) });
  },

  patchEdition(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const body = c.req.valid('json');

    const edition = store.patchEdition(tenant.id, id, {
      status: body.status,
      metadata: body.metadata,
      publishAt: body.publish_at
    });

    if (!edition) return c.json({ error: 'not_found' }, 404);
    return c.json(edition);
  },

  publishEdition(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = store.patchEdition(tenant.id, id, { status: 'active' });
    if (!edition) return c.json({ error: 'not_found' }, 404);
    return c.json(edition);
  },

  archiveEdition(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = store.patchEdition(tenant.id, id, { status: 'archived' });
    if (!edition) return c.json({ error: 'not_found' }, 404);
    return c.json(edition);
  },

  listRounds(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const edition = store.getEdition(tenant.id, id);
    if (!edition) return c.json({ error: 'not_found' }, 404);

    return c.json({ rounds: store.listRounds(tenant.id, edition.id) });
  },

  patchRound(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const body = c.req.valid('json');

    const round = store.getRound(tenant.id, id);
    if (!round) return c.json({ error: 'not_found' }, 404);

    const edition = store.getEdition(tenant.id, round.editionId);
    if (!edition || edition.status !== 'draft') {
      return c.json({ error: 'round_mutation_requires_draft_edition' }, 409);
    }

    const updated = store.patchRound(tenant.id, id, {
      prompt: body.prompt,
      options: body.options,
      correctAnswer: body.correct_answer,
      metadata: body.metadata
    });

    return c.json(updated);
  },

  deleteRound(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const round = store.getRound(tenant.id, id);
    if (!round) return c.json({ error: 'not_found' }, 404);

    const edition = store.getEdition(tenant.id, round.editionId);
    if (!edition || edition.status !== 'draft') {
      return c.json({ error: 'round_mutation_requires_draft_edition' }, 409);
    }

    store.deleteRound(tenant.id, id);
    return c.json({ id, deleted: true });
  }
};
