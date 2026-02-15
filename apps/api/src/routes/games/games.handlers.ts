import type { GameConfig } from '@puzzlebox/shared';
import { requireAdmin, requirePlayer } from '../../lib/authz';
import { store } from '../../lib/store';

function parseGameConfig(input: Record<string, unknown>): GameConfig {
  return {
    roundsPerEdition: Number(input.rounds_per_edition ?? 5),
    partialCredit: Boolean(input.partial_credit ?? true),
    shareEmojiCorrect: String(input.share_emoji_correct ?? '🟩'),
    shareEmojiIncorrect: String(input.share_emoji_incorrect ?? '🟥'),
    shareEmojiGame: String(input.share_emoji_game ?? '🎯'),
    shareUrlTemplate: String(input.share_url_template ?? 'https://example.com/{slug}'),
    allowAnonymous: Boolean(input.allow_anonymous ?? true)
  };
}

function gameToResponse(game: any) {
  return {
    id: game.id,
    slug: game.slug,
    mode: game.mode,
    name: game.name,
    active: game.active,
    config: {
      rounds_per_edition: game.config.roundsPerEdition,
      partial_credit: game.config.partialCredit,
      share_emoji_correct: game.config.shareEmojiCorrect,
      share_emoji_incorrect: game.config.shareEmojiIncorrect,
      share_emoji_game: game.config.shareEmojiGame,
      share_url_template: game.config.shareUrlTemplate,
      allow_anonymous: game.config.allowAnonymous
    }
  };
}

export const gamesHandlers = {
  listGames(c: any) {
    const tenant = c.get('tenant');
    const apiKey = c.req.header('X-API-Key');
    if (apiKey) {
      const maybeAdmin = requireAdmin(c);
      if (!maybeAdmin.ok) return maybeAdmin.response;
      return c.json({ games: store.listGames(tenant.id).map(gameToResponse) });
    }

    const maybePlayer = requirePlayer(c);
    if (!maybePlayer.ok) return maybePlayer.response;

    const games = store.listGames(tenant.id, false).map((game) => ({
      slug: game.slug,
      name: game.name,
      mode: game.mode,
      has_today: Boolean(store.resolveTodayEdition(tenant.id, game.slug))
    }));

    return c.json({ games });
  },

  createGame(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const body = c.req.valid('json');

    try {
      const game = store.createGame(tenant.id, {
        name: body.name,
        slug: body.slug,
        mode: body.mode,
        config: parseGameConfig(body.config)
      });

      return c.json(gameToResponse(game), 201);
    } catch (error) {
      if (error instanceof Error && error.message === 'game_slug_exists') {
        return c.json({ error: 'game_slug_exists' }, 409);
      }
      throw error;
    }
  },

  getGame(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = store.getGameBySlug(tenant.id, slug);
    if (!game) return c.json({ error: 'not_found' }, 404);

    return c.json(gameToResponse(game));
  },

  patchGame(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const body = c.req.valid('json');

    const game = store.patchGame(tenant.id, slug, {
      name: body.name,
      active: body.active,
      config: body.config ? parseGameConfig(body.config) : undefined
    });

    if (!game) return c.json({ error: 'not_found' }, 404);
    return c.json(gameToResponse(game));
  },

  deleteGame(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = store.patchGame(tenant.id, slug, { active: false });
    if (!game) return c.json({ error: 'not_found' }, 404);

    return c.json({ id: game.id, active: game.active });
  },

  today(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const today = store.resolveTodayEdition(tenant.id, slug);
    if (!today) return c.json({ error: 'today_not_found' }, 404);

    const existingSession = store
      .listSessionsByTenant(tenant.id)
      .find((session) => session.playerId === player.playerId && session.editionId === today.edition.id);

    const responses = existingSession ? store.getSessionResponses(tenant.id, existingSession.id) : [];

    return c.json({
      edition_id: today.edition.id,
      edition_date: today.edition.editionDate,
      game: {
        name: today.game.name,
        slug: today.game.slug,
        mode: today.game.mode
      },
      rounds: today.rounds.map((round) => ({
        id: round.id,
        position: round.position,
        prompt: round.prompt,
        options: round.options
      })),
      existing_session: existingSession
        ? {
            id: existingSession.id,
            score: existingSession.score,
            completed_at: existingSession.completedAt,
            responses
          }
        : null
    });
  }
};
