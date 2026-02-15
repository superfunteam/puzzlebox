import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const rounds = pgTable(
  'rounds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    editionId: uuid('edition_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    position: integer('position').notNull(),
    prompt: text('prompt').notNull(),
    options: jsonb('options').$type<Array<{ key: string; label: string }>>().notNull(),
    correctAnswer: jsonb('correct_answer').$type<Record<string, unknown> | null>(),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    editionPosUnique: uniqueIndex('rounds_edition_position_unique').on(table.editionId, table.position)
  })
);
