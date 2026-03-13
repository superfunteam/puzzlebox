import { createHash, randomUUID } from 'node:crypto';
import {
  apiKeys,
  editions,
  games,
  magicLinks,
  playerStreaks,
  players,
  responses,
  rounds,
  sessions,
  tenants
} from '@puzzlebox/db';
import { normalizeGameConfig, type Edition, type Game, type GameConfig, type Player, type PlayerStreak, type ResponseRecord, type Round, type Session, type Tenant } from '@puzzlebox/shared';
import { and, asc, eq, inArray, isNotNull, lte, or, sql } from 'drizzle-orm';
import { getDb } from './postgres';
import type { AsyncStore } from './store.types';
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

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toIsoOrNull(value: Date | string | null): string | null {
  if (!value) return null;
  return toIso(value);
}

function toDateString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
}

function requireRow<T>(row: T | undefined, context: string): T {
  if (!row) {
    throw new Error(`${context}_missing_returning_row`);
  }
  return row;
}

function toDbConfig(config: GameConfig): Record<string, unknown> {
  return config as unknown as Record<string, unknown>;
}

function mapTenant(row: typeof tenants.$inferSelect): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    timezone: row.timezone,
    authConfig: row.authConfig ?? {},
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt)
  };
}

function mapGame(row: typeof games.$inferSelect): Game {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    slug: row.slug,
    mode: row.mode,
    lifecycle: row.lifecycle,
    config: normalizeGameConfig((row.config ?? {}) as Partial<GameConfig>),
    active: row.active,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt)
  };
}

function mapEdition(row: typeof editions.$inferSelect): Edition {
  return {
    id: row.id,
    gameId: row.gameId,
    tenantId: row.tenantId,
    editionDate: toDateString(row.editionDate),
    status: row.status,
    publishAt: toIsoOrNull(row.publishAt),
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt)
  };
}

function mapRound(row: typeof rounds.$inferSelect): Round {
  return {
    id: row.id,
    editionId: row.editionId,
    tenantId: row.tenantId,
    position: row.position,
    prompt: row.prompt,
    options: row.options,
    correctAnswer: row.correctAnswer ?? null,
    metadata: row.metadata ?? null,
    createdAt: toIso(row.createdAt)
  };
}

function mapPlayer(row: typeof players.$inferSelect): Player {
  return {
    id: row.id,
    tenantId: row.tenantId,
    authMethod: row.authMethod,
    email: row.email ?? null,
    externalId: row.externalId ?? null,
    displayName: row.displayName ?? null,
    anonymousToken: row.anonymousToken ?? null,
    timezone: row.timezone ?? null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt)
  };
}

function mapSession(row: typeof sessions.$inferSelect): Session {
  return {
    id: row.id,
    playerId: row.playerId,
    editionId: row.editionId,
    tenantId: row.tenantId,
    startedAt: toIso(row.startedAt),
    completedAt: toIsoOrNull(row.completedAt),
    score: row.score ?? null,
    maxScore: row.maxScore ?? null,
    shareData: (row.shareData ?? null) as Record<string, unknown> | null
  };
}

function mapResponse(row: typeof responses.$inferSelect): ResponseRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    roundId: row.roundId,
    tenantId: row.tenantId,
    answer: row.answer,
    isCorrect: row.isCorrect ?? null,
    score: row.score,
    respondedAt: toIso(row.respondedAt)
  };
}

function mapStreak(row: typeof playerStreaks.$inferSelect): PlayerStreak {
  return {
    playerId: row.playerId,
    gameId: row.gameId,
    tenantId: row.tenantId,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastPlayedDate: row.lastPlayedDate ? toDateString(row.lastPlayedDate) : null,
    freezesRemaining: row.freezesRemaining,
    updatedAt: toIso(row.updatedAt)
  };
}

async function findTenantBySlug(slug: string): Promise<Tenant | null> {
  const db = getDb();
  const [row] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return row ? mapTenant(row) : null;
}

export function createPostgresStore(): AsyncStore {
  return {
    async initDefaultTenant(input) {
      const db = getDb();
      const now = nowIso();

      let tenant = await findTenantBySlug(input.slug);
      if (!tenant) {
        const [inserted] = await db
          .insert(tenants)
          .values({
            name: input.name,
            slug: input.slug,
            timezone: input.timezone,
            authConfig: {},
            createdAt: new Date(now),
            updatedAt: new Date(now)
          })
          .returning();
        tenant = mapTenant(requireRow(inserted, 'tenant_insert'));
      }

      const keyHash = hashApiKey(input.apiKey);
      const [existingKey] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.tenantId, tenant.id), eq(apiKeys.keyHash, keyHash)))
        .limit(1);

      if (!existingKey) {
        await db.insert(apiKeys).values({
          tenantId: tenant.id,
          keyHash,
          label: 'default',
          scopes: ['admin', 'editor'],
          createdAt: new Date(now)
        });
      }
    },

    async getTenantBySlug(slug) {
      return findTenantBySlug(slug);
    },

    async getTenant(tenantId) {
      const db = getDb();
      const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      return row ? mapTenant(row) : null;
    },

    async validateApiKey(tenantId, key) {
      const db = getDb();
      const now = new Date();
      const keyHash = hashApiKey(key);

      const [record] = await db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.tenantId, tenantId),
            or(eq(apiKeys.keyHash, keyHash), eq(apiKeys.keyHash, key)),
            or(sql`${apiKeys.expiresAt} IS NULL`, sql`${apiKeys.expiresAt} > now()`)
          )
        )
        .limit(1);

      if (!record) return null;

      await db.update(apiKeys).set({ lastUsedAt: now }).where(eq(apiKeys.id, record.id));

      const value: ApiKeyRecord = {
        tenantId: record.tenantId,
        key,
        scopes: record.scopes
      };
      return value;
    },

    async listPlayers(tenantId) {
      const db = getDb();
      const rows = await db.select().from(players).where(eq(players.tenantId, tenantId));
      return rows.map(mapPlayer);
    },

    async getPlayer(tenantId, playerId) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(players)
        .where(and(eq(players.id, playerId), eq(players.tenantId, tenantId)))
        .limit(1);
      return row ? mapPlayer(row) : null;
    },

    async deletePlayer(tenantId, playerId) {
      const db = getDb();
      const player = await this.getPlayer(tenantId, playerId);
      if (!player) return false;

      await db.transaction(async (tx: any) => {
        const sessionRows = await tx
          .select({ id: sessions.id })
          .from(sessions)
          .where(and(eq(sessions.tenantId, tenantId), eq(sessions.playerId, playerId)));
        const sessionIds = sessionRows.map((row: { id: string }) => row.id);

        if (sessionIds.length > 0) {
          await tx
            .delete(responses)
            .where(and(eq(responses.tenantId, tenantId), inArray(responses.sessionId, sessionIds)));
        }

        await tx.delete(sessions).where(and(eq(sessions.tenantId, tenantId), eq(sessions.playerId, playerId)));
        await tx
          .delete(playerStreaks)
          .where(and(eq(playerStreaks.tenantId, tenantId), eq(playerStreaks.playerId, playerId)));
        await tx.delete(players).where(and(eq(players.tenantId, tenantId), eq(players.id, playerId)));
      });

      return true;
    },

    async createAnonymousPlayer(tenantId, timezone) {
      const db = getDb();
      const now = new Date(nowIso());

      const [row] = await db
        .insert(players)
        .values({
          tenantId,
          authMethod: 'anonymous',
          email: null,
          externalId: null,
          displayName: null,
          anonymousToken: randomUUID(),
          timezone,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return mapPlayer(requireRow(row, 'player_insert_anonymous'));
    },

    async createOrGetEmailPlayer(tenantId, email, authMethod) {
      const db = getDb();
      const lowered = email.toLowerCase();
      const [existing] = await db
        .select()
        .from(players)
        .where(and(eq(players.tenantId, tenantId), sql`lower(${players.email}) = ${lowered}`))
        .limit(1);
      if (existing) return mapPlayer(existing);

      try {
        const now = new Date(nowIso());
        const [created] = await db
          .insert(players)
          .values({
            tenantId,
            authMethod,
            email,
            externalId: null,
            displayName: null,
            anonymousToken: null,
            timezone: null,
            createdAt: now,
            updatedAt: now
          })
          .returning();
        return mapPlayer(requireRow(created, 'player_insert_email'));
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        const [raceWinner] = await db
          .select()
          .from(players)
          .where(and(eq(players.tenantId, tenantId), sql`lower(${players.email}) = ${lowered}`))
          .limit(1);
        if (!raceWinner) throw error;
        return mapPlayer(raceWinner);
      }
    },

    async createOrGetExternalPlayer(tenantId, externalId) {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(players)
        .where(and(eq(players.tenantId, tenantId), eq(players.externalId, externalId)))
        .limit(1);
      if (existing) return mapPlayer(existing);

      const now = new Date(nowIso());
      const [created] = await db
        .insert(players)
        .values({
          tenantId,
          authMethod: 'external',
          email: null,
          externalId,
          displayName: null,
          anonymousToken: null,
          timezone: null,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return mapPlayer(requireRow(created, 'player_insert_external'));
    },

    async updatePlayer(tenantId, playerId, patch) {
      const db = getDb();
      const player = await this.getPlayer(tenantId, playerId);
      if (!player) return null;

      const [updated] = await db
        .update(players)
        .set({
          timezone: patch.timezone ?? player.timezone,
          displayName: patch.displayName ?? player.displayName,
          updatedAt: new Date(nowIso())
        })
        .where(and(eq(players.id, playerId), eq(players.tenantId, tenantId)))
        .returning();

      return updated ? mapPlayer(updated) : null;
    },

    async createMagicLink(tenantId, email, ttlSeconds) {
      const db = getDb();
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await db.insert(magicLinks).values({
        token,
        tenantId,
        email,
        expiresAt
      });
      return token;
    },

    async consumeMagicLink(token) {
      const db = getDb();
      const row = await db.transaction(async (tx: any) => {
        const [found] = await tx.select().from(magicLinks).where(eq(magicLinks.token, token)).limit(1);
        if (!found) return null;
        await tx.delete(magicLinks).where(eq(magicLinks.token, token));
        return found;
      });

      if (!row) return null;

      const record: MagicLinkRecord = {
        token: row.token,
        tenantId: row.tenantId,
        email: row.email,
        expiresAt: toIso(row.expiresAt)
      };

      if (new Date(record.expiresAt).valueOf() < Date.now()) {
        return null;
      }

      return record;
    },

    async createGame(tenantId, input) {
      const db = getDb();
      const [duplicate] = await db
        .select({ id: games.id })
        .from(games)
        .where(and(eq(games.tenantId, tenantId), eq(games.slug, input.slug)))
        .limit(1);
      if (duplicate) throw new Error('game_slug_exists');

      const now = new Date(nowIso());
      const [row] = await db
        .insert(games)
        .values({
          tenantId,
          name: input.name,
          slug: input.slug,
          mode: input.mode,
          lifecycle: input.lifecycle,
          config: toDbConfig(input.config),
          active: true,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return mapGame(requireRow(row, 'game_insert'));
    },

    async listGames(tenantId, includeInactive = true) {
      const db = getDb();
      const rows = await db
        .select()
        .from(games)
        .where(includeInactive ? eq(games.tenantId, tenantId) : and(eq(games.tenantId, tenantId), eq(games.active, true)));
      return rows.map(mapGame);
    },

    async getGameBySlug(tenantId, slug) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(games)
        .where(and(eq(games.tenantId, tenantId), eq(games.slug, slug)))
        .limit(1);
      return row ? mapGame(row) : null;
    },

    async getGameById(tenantId, gameId) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(games)
        .where(and(eq(games.tenantId, tenantId), eq(games.id, gameId)))
        .limit(1);
      return row ? mapGame(row) : null;
    },

    async patchGame(tenantId, slug, patch) {
      const db = getDb();
      const game = await this.getGameBySlug(tenantId, slug);
      if (!game) return null;

      const [updated] = await db
        .update(games)
        .set({
          name: patch.name ?? game.name,
          active: patch.active ?? game.active,
          lifecycle: patch.lifecycle ?? game.lifecycle,
          config: patch.config ? toDbConfig(patch.config) : toDbConfig(game.config),
          updatedAt: new Date(nowIso())
        })
        .where(and(eq(games.tenantId, tenantId), eq(games.slug, slug)))
        .returning();

      return updated ? mapGame(updated) : null;
    },

    async createEdition(tenantId, gameId, input) {
      const db = getDb();
      const [duplicate] = await db
        .select({ id: editions.id })
        .from(editions)
        .where(and(eq(editions.tenantId, tenantId), eq(editions.gameId, gameId), eq(editions.editionDate, input.editionDate)))
        .limit(1);
      if (duplicate) throw new Error('edition_exists');

      return db.transaction(async (tx: any) => {
        const now = new Date(nowIso());
        const [editionRow] = await tx
          .insert(editions)
          .values({
            gameId,
            tenantId,
            editionDate: input.editionDate,
            status: input.status,
            publishAt: parseIsoOrNull(input.publishAt) ?? null,
            metadata: input.metadata,
            createdAt: now,
            updatedAt: now
          })
          .returning();
        const editionRowSafe = requireRow(editionRow, 'edition_insert');

        const sortedRounds = input.rounds.slice().sort((a, b) => a.position - b.position);
        const roundRows =
          sortedRounds.length === 0
            ? []
            : await tx
                .insert(rounds)
                .values(
                  sortedRounds.map((round) => ({
                    editionId: editionRowSafe.id,
                    tenantId,
                    position: round.position,
                    prompt: round.prompt,
                    options: round.options,
                    correctAnswer: round.correctAnswer,
                    metadata: round.metadata,
                    createdAt: now
                  }))
                )
                .returning();

        return {
          edition: mapEdition(editionRowSafe),
          rounds: roundRows.map(mapRound)
        };
      });
    },

    async listEditionsByGame(tenantId, gameId) {
      const db = getDb();
      const rows = await db
        .select()
        .from(editions)
        .where(and(eq(editions.tenantId, tenantId), eq(editions.gameId, gameId)))
        .orderBy(asc(editions.editionDate));
      return rows.map(mapEdition);
    },

    async getEdition(tenantId, editionId) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(editions)
        .where(and(eq(editions.tenantId, tenantId), eq(editions.id, editionId)))
        .limit(1);
      return row ? mapEdition(row) : null;
    },

    async getGameByEdition(tenantId, editionId) {
      const edition = await this.getEdition(tenantId, editionId);
      if (!edition) return null;
      const game = await this.getGameById(tenantId, edition.gameId);
      if (!game) return null;
      return { game, edition };
    },

    async patchEdition(tenantId, editionId, patch) {
      const db = getDb();
      const existing = await this.getEdition(tenantId, editionId);
      if (!existing) return null;

      const [row] = await db
        .update(editions)
        .set({
          status: patch.status ?? existing.status,
          metadata: patch.metadata ?? existing.metadata,
          publishAt: patch.publishAt === undefined ? parseIsoOrNull(existing.publishAt) : parseIsoOrNull(patch.publishAt),
          updatedAt: new Date(nowIso())
        })
        .where(and(eq(editions.tenantId, tenantId), eq(editions.id, editionId)))
        .returning();

      return row ? mapEdition(row) : null;
    },

    async listRounds(tenantId, editionId) {
      const db = getDb();
      const rows = await db
        .select()
        .from(rounds)
        .where(and(eq(rounds.tenantId, tenantId), eq(rounds.editionId, editionId)))
        .orderBy(asc(rounds.position));
      return rows.map(mapRound);
    },

    async getRound(tenantId, roundId) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(rounds)
        .where(and(eq(rounds.tenantId, tenantId), eq(rounds.id, roundId)))
        .limit(1);
      return row ? mapRound(row) : null;
    },

    async patchRound(tenantId, roundId, patch) {
      const db = getDb();
      const existing = await this.getRound(tenantId, roundId);
      if (!existing) return null;

      const [row] = await db
        .update(rounds)
        .set({
          prompt: patch.prompt ?? existing.prompt,
          options: patch.options ?? existing.options,
          correctAnswer: patch.correctAnswer ?? existing.correctAnswer,
          metadata: patch.metadata ?? existing.metadata
        })
        .where(and(eq(rounds.tenantId, tenantId), eq(rounds.id, roundId)))
        .returning();

      return row ? mapRound(row) : null;
    },

    async deleteRound(tenantId, roundId) {
      const db = getDb();
      const existing = await this.getRound(tenantId, roundId);
      if (!existing) return false;
      await db.delete(rounds).where(and(eq(rounds.tenantId, tenantId), eq(rounds.id, roundId)));
      return true;
    },

    async resolveTodayEdition(tenantId, gameSlug, now = new Date()) {
      const game = await this.getGameBySlug(tenantId, gameSlug);
      if (!game || !game.active) return null;

      const tenant = await this.getTenant(tenantId);
      if (!tenant) return null;

      const todayDate = dateInTimezone(now, tenant.timezone);
      const db = getDb();
      const [editionRow] = await db
        .select()
        .from(editions)
        .where(
          and(
            eq(editions.tenantId, tenantId),
            eq(editions.gameId, game.id),
            eq(editions.editionDate, todayDate),
            eq(editions.status, 'active')
          )
        )
        .limit(1);

      if (!editionRow) return null;

      const roundValues = await this.listRounds(tenantId, editionRow.id);
      return {
        game,
        edition: mapEdition(editionRow),
        rounds: roundValues
      };
    },

    async createSession(tenantId, playerId, editionId) {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.tenantId, tenantId), eq(sessions.playerId, playerId), eq(sessions.editionId, editionId)))
        .limit(1);
      if (existing) return { created: null, existing: mapSession(existing) };

      try {
        const [created] = await db
          .insert(sessions)
          .values({
            tenantId,
            playerId,
            editionId,
            startedAt: new Date(nowIso()),
            completedAt: null,
            score: null,
            maxScore: null,
            shareData: null
          })
          .returning();
        return { created: mapSession(requireRow(created, 'session_insert')), existing: null };
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        const [race] = await db
          .select()
          .from(sessions)
          .where(and(eq(sessions.tenantId, tenantId), eq(sessions.playerId, playerId), eq(sessions.editionId, editionId)))
          .limit(1);
        return { created: null, existing: race ? mapSession(race) : null };
      }
    },

    async countUniquePlayersByGame(tenantId, gameId) {
      const db = getDb();
      const [row] = await db
        .select({
          count: sql<number>`count(distinct ${sessions.playerId})`
        })
        .from(sessions)
        .innerJoin(editions, eq(sessions.editionId, editions.id))
        .where(and(eq(sessions.tenantId, tenantId), eq(editions.gameId, gameId)));
      return Number(row?.count ?? 0);
    },

    async hasPlayerSessionForGame(tenantId, playerId, gameId) {
      const db = getDb();
      const [row] = await db
        .select({ id: sessions.id })
        .from(sessions)
        .innerJoin(editions, eq(sessions.editionId, editions.id))
        .where(and(eq(sessions.tenantId, tenantId), eq(sessions.playerId, playerId), eq(editions.gameId, gameId)))
        .limit(1);
      return Boolean(row);
    },

    async getSession(tenantId, sessionId) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.tenantId, tenantId), eq(sessions.id, sessionId)))
        .limit(1);
      return row ? mapSession(row) : null;
    },

    async getSessionResponses(tenantId, sessionId) {
      const db = getDb();
      const rows = await db
        .select()
        .from(responses)
        .where(and(eq(responses.tenantId, tenantId), eq(responses.sessionId, sessionId)));
      return rows.map(mapResponse);
    },

    async createOrGetResponse(tenantId, input) {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(responses)
        .where(and(eq(responses.tenantId, tenantId), eq(responses.sessionId, input.sessionId), eq(responses.roundId, input.roundId)))
        .limit(1);
      if (existing) return { created: null, existing: mapResponse(existing) };

      try {
        const [created] = await db
          .insert(responses)
          .values({
            tenantId,
            sessionId: input.sessionId,
            roundId: input.roundId,
            answer: input.answer,
            isCorrect: input.isCorrect,
            score: input.score,
            respondedAt: new Date(nowIso())
          })
          .returning();
        return { created: mapResponse(requireRow(created, 'response_insert')), existing: null };
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        const [race] = await db
          .select()
          .from(responses)
          .where(and(eq(responses.tenantId, tenantId), eq(responses.sessionId, input.sessionId), eq(responses.roundId, input.roundId)))
          .limit(1);
        return { created: null, existing: race ? mapResponse(race) : null };
      }
    },

    async completeSession(tenantId, sessionId, input) {
      const db = getDb();
      const session = await this.getSession(tenantId, sessionId);
      if (!session) return null;

      const [updated] = await db
        .update(sessions)
        .set({
          completedAt: parseIsoOrNull(session.completedAt) ?? new Date(nowIso()),
          score: input.score,
          maxScore: input.maxScore,
          shareData: input.shareData
        })
        .where(and(eq(sessions.tenantId, tenantId), eq(sessions.id, sessionId)))
        .returning();

      return updated ? mapSession(updated) : null;
    },

    async getStreak(tenantId, playerId, gameId) {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(playerStreaks)
        .where(and(eq(playerStreaks.tenantId, tenantId), eq(playerStreaks.playerId, playerId), eq(playerStreaks.gameId, gameId)))
        .limit(1);
      if (existing) return mapStreak(existing);

      const createdAt = new Date(nowIso());
      const [created] = await db
        .insert(playerStreaks)
        .values({
          tenantId,
          playerId,
          gameId,
          currentStreak: 0,
          longestStreak: 0,
          lastPlayedDate: null,
          freezesRemaining: 2,
          updatedAt: createdAt
        })
        .returning();
      return mapStreak(requireRow(created, 'streak_insert'));
    },

    async setStreak(value) {
      const db = getDb();
      const [upserted] = await db
        .insert(playerStreaks)
        .values({
          tenantId: value.tenantId,
          playerId: value.playerId,
          gameId: value.gameId,
          currentStreak: value.currentStreak,
          longestStreak: value.longestStreak,
          lastPlayedDate: value.lastPlayedDate,
          freezesRemaining: value.freezesRemaining,
          updatedAt: parseIsoOrNull(value.updatedAt) ?? new Date(nowIso())
        })
        .onConflictDoUpdate({
          target: [playerStreaks.playerId, playerStreaks.gameId],
          set: {
            tenantId: value.tenantId,
            currentStreak: value.currentStreak,
            longestStreak: value.longestStreak,
            lastPlayedDate: value.lastPlayedDate,
            freezesRemaining: value.freezesRemaining,
            updatedAt: parseIsoOrNull(value.updatedAt) ?? new Date(nowIso())
          }
        })
        .returning();

      return mapStreak(requireRow(upserted, 'streak_upsert'));
    },

    async listPlayerStreaks(tenantId, playerId) {
      const db = getDb();
      const rows = await db
        .select()
        .from(playerStreaks)
        .where(and(eq(playerStreaks.tenantId, tenantId), eq(playerStreaks.playerId, playerId)));
      return rows.map(mapStreak);
    },

    async listSessionsByTenant(tenantId) {
      const db = getDb();
      const rows = await db.select().from(sessions).where(eq(sessions.tenantId, tenantId));
      return rows.map(mapSession);
    },

    async listResponsesByTenant(tenantId) {
      const db = getDb();
      const rows = await db.select().from(responses).where(eq(responses.tenantId, tenantId));
      return rows.map(mapResponse);
    },

    async listEditionsByTenant(tenantId) {
      const db = getDb();
      const rows = await db.select().from(editions).where(eq(editions.tenantId, tenantId));
      return rows.map(mapEdition);
    },

    async listRoundsByTenant(tenantId) {
      const db = getDb();
      const rows = await db.select().from(rounds).where(eq(rounds.tenantId, tenantId));
      return rows.map(mapRound);
    },

    async activatePendingEditions(now = new Date()) {
      const db = getDb();
      const updated = await db
        .update(editions)
        .set({
          status: 'active',
          updatedAt: new Date(nowIso())
        })
        .where(and(eq(editions.status, 'scheduled'), isNotNull(editions.publishAt), lte(editions.publishAt, now)))
        .returning({ id: editions.id });

      return updated.length;
    },

    async __resetForTests() {
      const db = getDb();
      await db.transaction(async (tx: any) => {
        await tx.delete(responses);
        await tx.delete(sessions);
        await tx.delete(rounds);
        await tx.delete(editions);
        await tx.delete(playerStreaks);
        await tx.delete(players);
        await tx.delete(games);
        await tx.delete(magicLinks);
        await tx.delete(apiKeys);
        await tx.delete(tenants);
      });
    }
  };
}
