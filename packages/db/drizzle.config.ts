import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Keep drizzle-kit on compiled ESM output to avoid TS/CJS loader edge cases.
  schema: './dist/schema/index.js',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/puzzlebox'
  }
});
