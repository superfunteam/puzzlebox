import { randomUUID } from 'node:crypto';
import type {
  Edition,
  Game,
  GameConfig,
  Player,
  PlayerStreak,
  ResponseRecord,
  Round,
  Session,
  Tenant
} from '@puzzlebox/shared';
import { DEFAULTS } from '@puzzlebox/shared';
import { dateInTimezone, nowIso, parseIsoOrNull } from './time';

interface ApiKeyRecord {
  tenantId: string;
  key: string;
  scopes: string[];
}

interface MagicLinkRecord {
  token: string;
  tenantId: string;
  email: string;
  expiresAt: string;
}

const tenants = new Map<string, Tenant>();
const tenantsBySlug = new Map<string, string>();
const apiKeys = new Map<string, ApiKeyRecord>();
const players = new Map<string, Player>();
const games = new Map<string, Game>();
const editions = new Map<string, Edition>();
const rounds = new Map<string, Round>();
const sessions = new Map<string, Session>();
const responses = new Map<string, ResponseRecord>();
const streaks = new Map<string, PlayerStreak>();
const magicLinks = new Map<string, MagicLinkRecord>();

function streakKey(playerId: string, gameId: string): string {
  return `${playerId}:${gameId}`;
}

function findTenantBySlug(slug: string): Tenant | null {
  const id = tenantsBySlug.get(slug);
  if (!id) return null;
  return tenants.get(id) ?? null;
}

export const store = {
  initDefaultTenant(input: { slug: string; name: string; timezone: string; apiKey: string }) {
    if (findTenantBySlug(input.slug)) return;
    const tenant: Tenant = {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      timezone: input.timezone,
      authConfig: {},
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    tenants.set(tenant.id, tenant);
    tenantsBySlug.set(tenant.slug, tenant.id);
    apiKeys.set(`${tenant.id}:${input.apiKey}`, {
      tenantId: tenant.id,
      key: input.apiKey,
      scopes: ['admin', 'editor']
    });
  },

  getTenantBySlug(slug: string) {
    return findTenantBySlug(slug);
  },

  getTenant(tenantId: string) {
    return tenants.get(tenantId) ?? null;
  },

  validateApiKey(tenantId: string, key: string): ApiKeyRecord | null {
    return apiKeys.get(`${tenantId}:${key}`) ?? null;
  },

  listPlayers(tenantId: string): Player[] {
    return Array.from(players.values()).filter((player) => player.tenantId === tenantId);
  },

  getPlayer(tenantId: string, playerId: string): Player | null {
    const player = players.get(playerId) ?? null;
    if (!player || player.tenantId !== tenantId) return null;
    return player;
  },

  deletePlayer(tenantId: string, playerId: string): boolean {
    const player = this.getPlayer(tenantId, playerId);
    if (!player) return false;

    players.delete(playerId);

    for (const [sessionId, session] of sessions.entries()) {
      if (session.playerId === playerId && session.tenantId === tenantId) {
        sessions.delete(sessionId);
        for (const [responseId, response] of responses.entries()) {
          if (response.sessionId === sessionId) responses.delete(responseId);
        }
      }
    }

    for (const key of streaks.keys()) {
      if (key.startsWith(`${playerId}:`)) streaks.delete(key);
    }

    return true;
  },

  createAnonymousPlayer(tenantId: string, timezone: string | null): Player {
    const player: Player = {
      id: randomUUID(),
      tenantId,
      authMethod: 'anonymous',
      email: null,
      externalId: null,
      displayName: null,
      anonymousToken: randomUUID(),
      timezone,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    players.set(player.id, player);
    return player;
  },

  createOrGetEmailPlayer(tenantId: string, email: string, authMethod: Player['authMethod']): Player {
    const existing = Array.from(players.values()).find(
      (player) => player.tenantId === tenantId && player.email?.toLowerCase() === email.toLowerCase()
    );
    if (existing) return existing;

    const created: Player = {
      id: randomUUID(),
      tenantId,
      authMethod,
      email,
      externalId: null,
      displayName: null,
      anonymousToken: null,
      timezone: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    players.set(created.id, created);
    return created;
  },

  createOrGetExternalPlayer(tenantId: string, externalId: string): Player {
    const existing = Array.from(players.values()).find(
      (player) => player.tenantId === tenantId && player.externalId === externalId
    );
    if (existing) return existing;

    const created: Player = {
      id: randomUUID(),
      tenantId,
      authMethod: 'external',
      email: null,
      externalId,
      displayName: null,
      anonymousToken: null,
      timezone: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    players.set(created.id, created);
    return created;
  },

  updatePlayer(tenantId: string, playerId: string, patch: Partial<Pick<Player, 'timezone' | 'displayName'>>): Player | null {
    const player = this.getPlayer(tenantId, playerId);
    if (!player) return null;

    const updated: Player = {
      ...player,
      timezone: patch.timezone ?? player.timezone,
      displayName: patch.displayName ?? player.displayName,
      updatedAt: nowIso()
    };

    players.set(player.id, updated);
    return updated;
  },

  createMagicLink(tenantId: string, email: string, ttlSeconds: number): string {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    magicLinks.set(token, { token, tenantId, email, expiresAt });
    return token;
  },

  consumeMagicLink(token: string): MagicLinkRecord | null {
    const record = magicLinks.get(token);
    if (!record) return null;
    magicLinks.delete(token);
    if (new Date(record.expiresAt).valueOf() < Date.now()) return null;
    return record;
  },

  createGame(tenantId: string, input: {
    name: string;
    slug: string;
    mode: Game['mode'];
    lifecycle: Game['lifecycle'];
    config: GameConfig;
  }): Game {
    const duplicate = Array.from(games.values()).find((game) => game.tenantId === tenantId && game.slug === input.slug);
    if (duplicate) throw new Error('game_slug_exists');

    const game: Game = {
      id: randomUUID(),
      tenantId,
      name: input.name,
      slug: input.slug,
      mode: input.mode,
      lifecycle: input.lifecycle,
      config: input.config,
      active: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    games.set(game.id, game);
    return game;
  },

  listGames(tenantId: string, includeInactive = true): Game[] {
    const all = Array.from(games.values()).filter((game) => game.tenantId === tenantId);
    return includeInactive ? all : all.filter((game) => game.active);
  },

  getGameBySlug(tenantId: string, slug: string): Game | null {
    return Array.from(games.values()).find((game) => game.tenantId === tenantId && game.slug === slug) ?? null;
  },

  getGameById(tenantId: string, gameId: string): Game | null {
    const game = games.get(gameId) ?? null;
    if (!game || game.tenantId !== tenantId) return null;
    return game;
  },

  patchGame(tenantId: string, slug: string, patch: Partial<Pick<Game, 'name' | 'active' | 'config' | 'lifecycle'>>): Game | null {
    const game = this.getGameBySlug(tenantId, slug);
    if (!game) return null;

    const updated: Game = {
      ...game,
      name: patch.name ?? game.name,
      active: patch.active ?? game.active,
      lifecycle: patch.lifecycle ?? game.lifecycle,
      config: patch.config ?? game.config,
      updatedAt: nowIso()
    };

    games.set(game.id, updated);
    return updated;
  },

  createEdition(tenantId: string, gameId: string, input: {
    editionDate: string;
    status: Edition['status'];
    publishAt: string | null;
    metadata: Record<string, unknown> | null;
    rounds: Array<{
      position: number;
      prompt: string;
      options: Array<{ key: string; label: string }>;
      correctAnswer: Record<string, unknown> | null;
      metadata: Record<string, unknown> | null;
    }>;
  }): { edition: Edition; rounds: Round[] } {
    const duplicate = Array.from(editions.values()).find(
      (edition) => edition.tenantId === tenantId && edition.gameId === gameId && edition.editionDate === input.editionDate
    );
    if (duplicate) throw new Error('edition_exists');

    const edition: Edition = {
      id: randomUUID(),
      gameId,
      tenantId,
      editionDate: input.editionDate,
      status: input.status,
      publishAt: input.publishAt,
      metadata: input.metadata,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    editions.set(edition.id, edition);

    const roundRecords = input.rounds
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((round) => {
        const created: Round = {
          id: randomUUID(),
          editionId: edition.id,
          tenantId,
          position: round.position,
          prompt: round.prompt,
          options: round.options,
          correctAnswer: round.correctAnswer,
          metadata: round.metadata,
          createdAt: nowIso()
        };
        rounds.set(created.id, created);
        return created;
      });

    return { edition, rounds: roundRecords };
  },

  listEditionsByGame(tenantId: string, gameId: string): Edition[] {
    return Array.from(editions.values())
      .filter((edition) => edition.tenantId === tenantId && edition.gameId === gameId)
      .sort((a, b) => a.editionDate.localeCompare(b.editionDate));
  },

  getEdition(tenantId: string, editionId: string): Edition | null {
    const edition = editions.get(editionId) ?? null;
    if (!edition || edition.tenantId !== tenantId) return null;
    return edition;
  },

  getGameByEdition(tenantId: string, editionId: string): { game: Game; edition: Edition } | null {
    const edition = this.getEdition(tenantId, editionId);
    if (!edition) return null;
    const game = this.getGameById(tenantId, edition.gameId);
    if (!game) return null;
    return { game, edition };
  },

  patchEdition(
    tenantId: string,
    editionId: string,
    patch: Partial<Pick<Edition, 'status' | 'metadata' | 'publishAt'>>
  ): Edition | null {
    const edition = this.getEdition(tenantId, editionId);
    if (!edition) return null;

    const updated: Edition = {
      ...edition,
      status: patch.status ?? edition.status,
      metadata: patch.metadata ?? edition.metadata,
      publishAt: patch.publishAt ?? edition.publishAt,
      updatedAt: nowIso()
    };

    editions.set(updated.id, updated);
    return updated;
  },

  listRounds(tenantId: string, editionId: string): Round[] {
    return Array.from(rounds.values())
      .filter((round) => round.tenantId === tenantId && round.editionId === editionId)
      .sort((a, b) => a.position - b.position);
  },

  getRound(tenantId: string, roundId: string): Round | null {
    const round = rounds.get(roundId) ?? null;
    if (!round || round.tenantId !== tenantId) return null;
    return round;
  },

  patchRound(
    tenantId: string,
    roundId: string,
    patch: Partial<Pick<Round, 'prompt' | 'options' | 'correctAnswer' | 'metadata'>>
  ): Round | null {
    const round = this.getRound(tenantId, roundId);
    if (!round) return null;

    const updated: Round = {
      ...round,
      prompt: patch.prompt ?? round.prompt,
      options: patch.options ?? round.options,
      correctAnswer: patch.correctAnswer ?? round.correctAnswer,
      metadata: patch.metadata ?? round.metadata
    };
    rounds.set(round.id, updated);
    return updated;
  },

  deleteRound(tenantId: string, roundId: string): boolean {
    const round = this.getRound(tenantId, roundId);
    if (!round) return false;
    rounds.delete(round.id);
    return true;
  },

  resolveTodayEdition(tenantId: string, gameSlug: string, now = new Date()): { game: Game; edition: Edition; rounds: Round[] } | null {
    const game = this.getGameBySlug(tenantId, gameSlug);
    if (!game || !game.active) return null;

    const tenant = tenants.get(tenantId);
    if (!tenant) return null;

    const todayDate = dateInTimezone(now, tenant.timezone);

    const edition = Array.from(editions.values()).find(
      (item) => item.tenantId === tenantId && item.gameId === game.id && item.editionDate === todayDate && item.status === 'active'
    );

    if (!edition) return null;

    return {
      game,
      edition,
      rounds: this.listRounds(tenantId, edition.id)
    };
  },

  createSession(tenantId: string, playerId: string, editionId: string): { created: Session | null; existing: Session | null } {
    const existing = Array.from(sessions.values()).find(
      (session) => session.tenantId === tenantId && session.playerId === playerId && session.editionId === editionId
    );
    if (existing) return { created: null, existing };

    const session: Session = {
      id: randomUUID(),
      playerId,
      editionId,
      tenantId,
      startedAt: nowIso(),
      completedAt: null,
      score: null,
      maxScore: null,
      shareData: null
    };
    sessions.set(session.id, session);
    return { created: session, existing: null };
  },

  countUniquePlayersByGame(tenantId: string, gameId: string): number {
    const editionIds = new Set(
      Array.from(editions.values())
        .filter((edition) => edition.tenantId === tenantId && edition.gameId === gameId)
        .map((edition) => edition.id)
    );

    if (editionIds.size === 0) return 0;

    return new Set(
      Array.from(sessions.values())
        .filter((session) => session.tenantId === tenantId && editionIds.has(session.editionId))
        .map((session) => session.playerId)
    ).size;
  },

  hasPlayerSessionForGame(tenantId: string, playerId: string, gameId: string): boolean {
    const editionIds = new Set(
      Array.from(editions.values())
        .filter((edition) => edition.tenantId === tenantId && edition.gameId === gameId)
        .map((edition) => edition.id)
    );

    if (editionIds.size === 0) return false;

    return Array.from(sessions.values()).some(
      (session) =>
        session.tenantId === tenantId &&
        session.playerId === playerId &&
        editionIds.has(session.editionId)
    );
  },

  getSession(tenantId: string, sessionId: string): Session | null {
    const session = sessions.get(sessionId) ?? null;
    if (!session || session.tenantId !== tenantId) return null;
    return session;
  },

  getSessionResponses(tenantId: string, sessionId: string): ResponseRecord[] {
    return Array.from(responses.values()).filter(
      (response) => response.tenantId === tenantId && response.sessionId === sessionId
    );
  },

  createOrGetResponse(
    tenantId: string,
    input: { sessionId: string; roundId: string; answer: Record<string, unknown>; isCorrect: boolean | null; score: number }
  ): { created: ResponseRecord | null; existing: ResponseRecord | null } {
    const existing = Array.from(responses.values()).find(
      (item) => item.tenantId === tenantId && item.sessionId === input.sessionId && item.roundId === input.roundId
    );
    if (existing) return { created: null, existing };

    const response: ResponseRecord = {
      id: randomUUID(),
      sessionId: input.sessionId,
      roundId: input.roundId,
      tenantId,
      answer: input.answer,
      isCorrect: input.isCorrect,
      score: input.score,
      respondedAt: nowIso()
    };

    responses.set(response.id, response);
    return { created: response, existing: null };
  },

  completeSession(tenantId: string, sessionId: string, input: { score: number; maxScore: number; shareData: Record<string, unknown> }): Session | null {
    const session = this.getSession(tenantId, sessionId);
    if (!session) return null;

    const updated: Session = {
      ...session,
      completedAt: session.completedAt ?? nowIso(),
      score: input.score,
      maxScore: input.maxScore,
      shareData: input.shareData
    };

    sessions.set(sessionId, updated);
    return updated;
  },

  getStreak(tenantId: string, playerId: string, gameId: string): PlayerStreak {
    const key = streakKey(playerId, gameId);
    const existing = streaks.get(key);
    if (existing) return existing;

    const created: PlayerStreak = {
      playerId,
      gameId,
      tenantId,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
      freezesRemaining: 2,
      updatedAt: nowIso()
    };
    streaks.set(key, created);
    return created;
  },

  setStreak(value: PlayerStreak): PlayerStreak {
    streaks.set(streakKey(value.playerId, value.gameId), value);
    return value;
  },

  listPlayerStreaks(tenantId: string, playerId: string): PlayerStreak[] {
    return Array.from(streaks.values()).filter((item) => item.tenantId === tenantId && item.playerId === playerId);
  },

  listSessionsByTenant(tenantId: string): Session[] {
    return Array.from(sessions.values()).filter((session) => session.tenantId === tenantId);
  },

  listResponsesByTenant(tenantId: string): ResponseRecord[] {
    return Array.from(responses.values()).filter((response) => response.tenantId === tenantId);
  },

  listEditionsByTenant(tenantId: string): Edition[] {
    return Array.from(editions.values()).filter((edition) => edition.tenantId === tenantId);
  },

  listRoundsByTenant(tenantId: string): Round[] {
    return Array.from(rounds.values()).filter((round) => round.tenantId === tenantId);
  },

  activatePendingEditions(now = new Date()): number {
    let activated = 0;
    for (const [id, edition] of editions.entries()) {
      if (edition.status !== 'scheduled' || !edition.publishAt) continue;
      const publishAtDate = parseIsoOrNull(edition.publishAt);
      if (!publishAtDate) continue;
      if (publishAtDate.valueOf() <= now.valueOf()) {
        editions.set(id, {
          ...edition,
          status: 'active',
          updatedAt: nowIso()
        });
        activated += 1;
      }
    }
    return activated;
  },

  __resetForTests() {
    players.clear();
    games.clear();
    editions.clear();
    rounds.clear();
    sessions.clear();
    responses.clear();
    streaks.clear();
    magicLinks.clear();
  }
};
