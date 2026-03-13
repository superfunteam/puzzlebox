import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const gameModeEnum = pgEnum('game_mode', ['pick_one', 'ordered_sequence', 'survey']);
export const gameLifecycleEnum = pgEnum('game_lifecycle', ['playtest', 'production']);

export const games = pgTable(
  'games',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    mode: gameModeEnum('mode').notNull(),
    lifecycle: gameLifecycleEnum('lifecycle').notNull().default('production'),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantSlugUnique: uniqueIndex('games_tenant_slug_unique').on(table.tenantId, table.slug)
  })
);
