import { date, jsonb, pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { games } from './games';
import { tenants } from './tenants';

export const editionStatusEnum = pgEnum('edition_status', ['draft', 'scheduled', 'active', 'archived']);

export const editions = pgTable(
  'editions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    editionDate: date('edition_date').notNull(),
    status: editionStatusEnum('status').notNull().default('draft'),
    publishAt: timestamp('publish_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    gameEditionUnique: uniqueIndex('editions_game_date_unique').on(table.gameId, table.editionDate),
    tenantGameDate: uniqueIndex('editions_tenant_game_date').on(table.tenantId, table.gameId, table.editionDate)
  })
);
