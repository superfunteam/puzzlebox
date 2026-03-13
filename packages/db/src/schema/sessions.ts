import { integer, jsonb, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { editions } from './editions.js';
import { players } from './players.js';
import { tenants } from './tenants.js';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    editionId: uuid('edition_id')
      .notNull()
      .references(() => editions.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    score: integer('score'),
    maxScore: integer('max_score'),
    shareData: jsonb('share_data').$type<Record<string, unknown> | null>()
  },
  (table) => ({
    sessionUnique: uniqueIndex('sessions_player_edition_unique').on(table.playerId, table.editionId),
    tenantLookup: uniqueIndex('sessions_tenant_player_edition').on(table.tenantId, table.playerId, table.editionId)
  })
);
