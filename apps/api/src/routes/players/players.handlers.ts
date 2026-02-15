import { requireAdmin, requirePlayer } from '../../lib/authz';
import { store } from '../../lib/store';

export const playersHandlers = {
  listPlayers(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    return c.json({ players: store.listPlayers(tenant.id) });
  },

  getPlayer(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const player = store.getPlayer(tenant.id, id);
    if (!player) return c.json({ error: 'not_found' }, 404);

    return c.json(player);
  },

  deletePlayer(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const deleted = store.deletePlayer(tenant.id, id);
    if (!deleted) return c.json({ error: 'not_found' }, 404);

    return c.json({ id, deleted: true });
  },

  myStats(c: any) {
    const playerAuth = requirePlayer(c);
    if (!playerAuth.ok) return playerAuth.response;

    const tenant = c.get('tenant');
    const playerId = playerAuth.playerId;
    const sessions = store.listSessionsByTenant(tenant.id).filter((session) => session.playerId === playerId);
    const games = store.listGames(tenant.id, true);

    const responseGames = games.map((game) => {
      const gameEditions = store.listEditionsByGame(tenant.id, game.id).map((edition) => edition.id);
      const gameSessions = sessions.filter((session) => gameEditions.includes(session.editionId));
      const streak = store.getStreak(tenant.id, playerId, game.id);

      const totalScore = gameSessions.reduce((sum, item) => sum + (item.score ?? 0), 0);
      const maxScore = gameSessions.reduce((sum, item) => sum + (item.maxScore ?? 0), 0);

      return {
        game_slug: game.slug,
        total_sessions: gameSessions.length,
        current_streak: streak.currentStreak,
        longest_streak: streak.longestStreak,
        average_score_pct: maxScore === 0 ? 0 : totalScore / maxScore,
        last_played: streak.lastPlayedDate,
        freezes_remaining: streak.freezesRemaining
      };
    });

    return c.json({
      player_id: playerId,
      games: responseGames
    });
  },

  patchMe(c: any) {
    const playerAuth = requirePlayer(c);
    if (!playerAuth.ok) return playerAuth.response;

    const tenant = c.get('tenant');
    const body = c.req.valid('json');

    const updated = store.updatePlayer(tenant.id, playerAuth.playerId, {
      timezone: body.timezone,
      displayName: body.display_name
    });

    if (!updated) return c.json({ error: 'not_found' }, 404);
    return c.json(updated);
  }
};
