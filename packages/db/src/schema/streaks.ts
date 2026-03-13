import { date, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { games } from './games';
import { players } from './players';
import { tenants } from './tenants';

export const streakEventTypeEnum = pgEnum('streak_event_type', ['auto_consumed', 'manual_consumed', 'granted', 'purchased']);

export const playerStreaks = pgTable(
  'player_streaks',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    lastPlayedDate: date('last_played_date'),
    freezesRemaining: integer('freezes_remaining').notNull().default(2),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniqueStreak: uniqueIndex('player_streaks_player_game_unique').on(table.playerId, table.gameId),
    tenantLookup: uniqueIndex('player_streaks_tenant_player_game').on(table.tenantId, table.playerId, table.gameId)
  })
);

export const streakFreezeEvents = pgTable('streak_freeze_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  gameId: uuid('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  eventType: streakEventTypeEnum('event_type').notNull(),
  freezeDate: date('freeze_date').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
