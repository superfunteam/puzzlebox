import { normalizeGameConfig, type GameConfig, type GameLifecycle } from '@puzzlebox/shared';
import { requireAdmin, requirePlayer } from '../../lib/authz';
import { presentGame, presentPublicGame, presentRound, presentSession } from '../../lib/presenters';
import { store } from '../../lib/store';

function parseGameConfigInput(input: Record<string, unknown>): Partial<GameConfig> {
  const patch: Partial<GameConfig> = {};

  if (input.rounds_per_edition !== undefined) patch.roundsPerEdition = Number(input.rounds_per_edition);
  if (input.partial_credit !== undefined) patch.partialCredit = Boolean(input.partial_credit);
  if (input.share_emoji_correct !== undefined) patch.shareEmojiCorrect = String(input.share_emoji_correct);
  if (input.share_emoji_incorrect !== undefined) patch.shareEmojiIncorrect = String(input.share_emoji_incorrect);
  if (input.share_emoji_game !== undefined) patch.shareEmojiGame = String(input.share_emoji_game);
  if (input.share_url_template !== undefined) patch.shareUrlTemplate = String(input.share_url_template);
  if (input.allow_anonymous !== undefined) patch.allowAnonymous = Boolean(input.allow_anonymous);

  return patch;
}

function parseGameLifecycle(input: unknown): GameLifecycle {
  return input === 'playtest' || input === 'production' ? input : 'production';
}

export const gamesHandlers = {
  async listGames(c: any) {
    const tenant = c.get('tenant');
    const apiKey = c.req.header('X-API-Key');
    if (apiKey) {
      const maybeAdmin = await requireAdmin(c);
      if (!maybeAdmin.ok) return maybeAdmin.response;
      return c.json({ games: (await store.listGames(tenant.id)).map(presentGame) });
    }

    const maybePlayer = requirePlayer(c);
    if (!maybePlayer.ok) return maybePlayer.response;

    const listedGames = await store.listGames(tenant.id, false);
    const games = await Promise.all(
      listedGames.map(async (game) =>
        presentPublicGame(game, Boolean(await store.resolveTodayEdition(tenant.id, game.slug)))
      )
    );

    return c.json({ games });
  },

  async createGame(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const body = c.req.valid('json');

    try {
      const game = await store.createGame(tenant.id, {
        name: body.name,
        slug: body.slug,
        mode: body.mode,
        lifecycle: parseGameLifecycle(body.lifecycle),
        config: normalizeGameConfig(parseGameConfigInput(body.config))
      });

      return c.json(presentGame(game), 201);
    } catch (error) {
      if (error instanceof Error && error.message === 'game_slug_exists') {
        return c.json({ error: 'game_slug_exists' }, 409);
      }
      throw error;
    }
  },

  async getGame(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = await store.getGameBySlug(tenant.id, slug);
    if (!game) return c.json({ error: 'not_found' }, 404);

    return c.json(presentGame(game));
  },

  async patchGame(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const body = c.req.valid('json');
    const existingGame = await store.getGameBySlug(tenant.id, slug);
    if (!existingGame) return c.json({ error: 'not_found' }, 404);

    const patch: Partial<{ name: string; active: boolean; config: GameConfig; lifecycle: GameLifecycle }> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.active !== undefined) patch.active = body.active;
    if (body.config !== undefined) {
      patch.config = normalizeGameConfig({
        ...existingGame.config,
        ...parseGameConfigInput(body.config)
      });
    }
    if (body.lifecycle !== undefined) patch.lifecycle = parseGameLifecycle(body.lifecycle);

    const game = await store.patchGame(tenant.id, slug, patch);
    if (!game) return c.json({ error: 'not_found' }, 404);

    return c.json(presentGame(game));
  },

  async deleteGame(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const game = await store.patchGame(tenant.id, slug, { active: false });
    if (!game) return c.json({ error: 'not_found' }, 404);

    return c.json({ id: game.id, active: game.active });
  },

  async today(c: any) {
    const player = requirePlayer(c);
    if (!player.ok) return player.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const today = await store.resolveTodayEdition(tenant.id, slug);
    if (!today) return c.json({ error: 'today_not_found' }, 404);

    const existingSession = (await store.listSessionsByTenant(tenant.id))
      .find((session) => session.playerId === player.playerId && session.editionId === today.edition.id);

    const responses = existingSession ? await store.getSessionResponses(tenant.id, existingSession.id) : [];

    return c.json({
      edition_id: today.edition.id,
      edition_date: today.edition.editionDate,
      game: {
        name: today.game.name,
        slug: today.game.slug,
        mode: today.game.mode,
        lifecycle: parseGameLifecycle(today.game.lifecycle),
        policy: presentGame(today.game).policy
      },
      rounds: today.rounds.map((round) => presentRound(round)),
      existing_session: existingSession ? presentSession(existingSession, responses) : null
    });
  }
};
