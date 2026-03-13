export type StorageBackend = 'memory' | 'postgres';

function parseStorageBackend(value: string): StorageBackend {
  if (value === 'memory' || value === 'postgres') return value;
  throw new Error('storage_backend_invalid');
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return ['1', 'true', 'yes', 'on', 'require'].includes(value.toLowerCase());
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name}_invalid`);
  }
  return parsed;
}

export function getEnv() {
  const port = parsePositiveInteger(process.env.PORT ?? '3000', 'port');
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
  const jwtTtlSeconds = parsePositiveInteger(process.env.JWT_TTL_SECONDS ?? '86400', 'jwt_ttl_seconds');
  const magicLinkTtlSeconds = parsePositiveInteger(
    process.env.MAGIC_LINK_TTL_SECONDS ?? '600',
    'magic_link_ttl_seconds'
  );
  const databaseUrl = process.env.DATABASE_URL ?? null;
  const storageBackend = parseStorageBackend(process.env.STORAGE_BACKEND ?? (databaseUrl ? 'postgres' : 'memory'));
  const databaseSsl = parseOptionalBoolean(process.env.DATABASE_SSL);
  const databasePoolMax = parsePositiveInteger(process.env.DATABASE_POOL_MAX ?? '10', 'database_pool_max');
  const databasePoolIdleMs = parsePositiveInteger(
    process.env.DATABASE_POOL_IDLE_MS ?? '30000',
    'database_pool_idle_ms'
  );
  const databasePoolConnectionTimeoutMs = parsePositiveInteger(
    process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? '10000',
    'database_pool_connection_timeout_ms'
  );
  const defaultTenantSlug = process.env.DEFAULT_TENANT_SLUG ?? 'demo';
  const defaultTenantName = process.env.DEFAULT_TENANT_NAME ?? 'Puzzlebox Demo';
  const defaultTenantTimezone = process.env.DEFAULT_TENANT_TIMEZONE ?? 'America/New_York';
  const defaultApiKey = process.env.DEFAULT_API_KEY ?? 'dev-admin-key';
  const streakGraceHours = parsePositiveInteger(process.env.STREAK_GRACE_HOURS ?? '3', 'streak_grace_hours');

  return {
    port,
    jwtSecret,
    jwtTtlSeconds,
    magicLinkTtlSeconds,
    databaseUrl,
    databaseSsl,
    storageBackend,
    databasePoolMax,
    databasePoolIdleMs,
    databasePoolConnectionTimeoutMs,
    defaultTenantSlug,
    defaultTenantName,
    defaultTenantTimezone,
    defaultApiKey,
    streakGraceHours
  };
}
