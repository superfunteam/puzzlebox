export function assertTenantMatch<T extends { tenantId: string }>(tenantId: string, value: T): T {
  if (value.tenantId !== tenantId) {
    throw new Error('tenant_mismatch');
  }
  return value;
}

export function filterByTenant<T extends { tenantId: string }>(tenantId: string, values: T[]): T[] {
  return values.filter((value) => value.tenantId === tenantId);
}
