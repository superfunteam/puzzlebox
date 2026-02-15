import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const authMethodEnum = pgEnum('auth_method', ['magic_link', 'oauth', 'external', 'anonymous']);

export const players = pgTable(
  'players',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    authMethod: authMethodEnum('auth_method').notNull(),
    email: text('email'),
    externalId: text('external_id'),
    displayName: text('display_name'),
    anonymousToken: text('anonymous_token'),
    timezone: text('timezone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantEmailUnique: uniqueIndex('players_tenant_email_unique').on(table.tenantId, table.email)
  })
);
