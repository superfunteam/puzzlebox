import * as schema from '@puzzlebox/db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getEnv } from './env';

type PuzzleboxDatabase = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | null = null;
let db: PuzzleboxDatabase | null = null;

function isLocalDatabaseUrl(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
  } catch {
    return false;
  }
}

export function getDb(): PuzzleboxDatabase {
  if (db) return db;

  const env = getEnv();
  if (!env.databaseUrl) {
    throw new Error('database_url_missing');
  }

  const useSsl = env.databaseSsl ?? !isLocalDatabaseUrl(env.databaseUrl);

  pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: env.databasePoolMax,
    idleTimeoutMillis: env.databasePoolIdleMs,
    connectionTimeoutMillis: env.databasePoolConnectionTimeoutMs
  });
  pool.on('error', (error) => {
    console.error('postgres_pool_error', error);
  });
  db = drizzle(pool, { schema });

  return db;
}

export async function closeDbPool() {
  if (!pool) return;
  await pool.end();
  pool = null;
  db = null;
}
