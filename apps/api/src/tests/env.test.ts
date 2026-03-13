import { afterEach, describe, expect, it } from 'vitest';
import { getEnv } from '../lib/env';

const ORIGINAL_ENV = { ...process.env };

function setEnv(overrides: Record<string, string | undefined>) {
  const next = { ...ORIGINAL_ENV };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  process.env = next;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('getEnv', () => {
  it('defaults to memory backend when DATABASE_URL is unset', () => {
    setEnv({ DATABASE_URL: undefined, STORAGE_BACKEND: undefined });
    expect(getEnv().storageBackend).toBe('memory');
  });

  it('defaults to postgres backend when DATABASE_URL is set', () => {
    setEnv({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/puzzlebox',
      STORAGE_BACKEND: undefined
    });

    expect(getEnv().storageBackend).toBe('postgres');
  });

  it('respects explicit STORAGE_BACKEND over auto-detection', () => {
    setEnv({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/puzzlebox',
      STORAGE_BACKEND: 'memory'
    });

    expect(getEnv().storageBackend).toBe('memory');
  });

  it('throws for invalid STORAGE_BACKEND values', () => {
    setEnv({ STORAGE_BACKEND: 'sqlite' });
    expect(() => getEnv()).toThrow('storage_backend_invalid');
  });

  it('parses database pool settings from env', () => {
    setEnv({
      DATABASE_POOL_MAX: '20',
      DATABASE_POOL_IDLE_MS: '60000',
      DATABASE_POOL_CONNECTION_TIMEOUT_MS: '5000'
    });

    const env = getEnv();
    expect(env.databasePoolMax).toBe(20);
    expect(env.databasePoolIdleMs).toBe(60000);
    expect(env.databasePoolConnectionTimeoutMs).toBe(5000);
  });

  it('throws when pool settings are not positive integers', () => {
    setEnv({ DATABASE_POOL_MAX: '0' });
    expect(() => getEnv()).toThrow('database_pool_max_invalid');
  });
});
