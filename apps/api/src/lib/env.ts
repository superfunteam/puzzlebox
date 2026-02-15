export function getEnv() {
  const port = Number(process.env.PORT ?? '3000');
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
  const jwtTtlSeconds = Number(process.env.JWT_TTL_SECONDS ?? '86400');
  const defaultTenantSlug = process.env.DEFAULT_TENANT_SLUG ?? 'demo';
  const defaultTenantName = process.env.DEFAULT_TENANT_NAME ?? 'Puzzlebox Demo';
  const defaultTenantTimezone = process.env.DEFAULT_TENANT_TIMEZONE ?? 'America/New_York';
  const defaultApiKey = process.env.DEFAULT_API_KEY ?? 'dev-admin-key';
  const streakGraceHours = Number(process.env.STREAK_GRACE_HOURS ?? '3');

  return {
    port,
    jwtSecret,
    jwtTtlSeconds,
    defaultTenantSlug,
    defaultTenantName,
    defaultTenantTimezone,
    defaultApiKey,
    streakGraceHours
  };
}
