import { boolean, integer, jsonb, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const responses = pgTable(
  'responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').notNull(),
    roundId: uuid('round_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    answer: jsonb('answer').$type<Record<string, unknown>>().notNull(),
    isCorrect: boolean('is_correct'),
    score: integer('score').notNull().default(0),
    respondedAt: timestamp('responded_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniquePerRound: uniqueIndex('responses_session_round_unique').on(table.sessionId, table.roundId),
    tenantLookup: uniqueIndex('responses_tenant_session_round').on(table.tenantId, table.sessionId, table.roundId)
  })
);
