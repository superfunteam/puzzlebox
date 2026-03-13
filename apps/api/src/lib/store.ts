import { getEnv } from './env';
import { memoryStore } from './store.memory';
import { createPostgresStore } from './store.postgres';
import type { AsyncStore } from './store.types';

function toAsyncMemoryStore(): AsyncStore {
  const source = memoryStore as Record<string, (...args: unknown[]) => unknown>;
  return new Proxy(
    {},
    {
      get(_target, key) {
        const method = source[String(key)];
        if (!method) return undefined;
        return async (...args: unknown[]) => method.apply(source, args);
      }
    }
  ) as AsyncStore;
}

function createStore(): AsyncStore {
  const env = getEnv();
  if (env.storageBackend === 'postgres') {
    if (!env.databaseUrl) {
      throw new Error('database_url_missing_for_postgres_backend');
    }
    return createPostgresStore();
  }

  return toAsyncMemoryStore();
}

export const store: AsyncStore = createStore();
