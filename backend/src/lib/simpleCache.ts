/**
 * Minimal in-memory TTL cache for expensive, read-only, filter-keyed queries (e.g. report
 * aggregations). Not a distributed cache — per-process only, fine for a single backend
 * instance. No eviction beyond lazy TTL expiry on read; entries are simply overwritten by key.
 */

const DEFAULT_TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Deterministic string key from any JSON-serializable filter object. */
export function cacheKey(namespace: string, filters: unknown): string {
  return `${namespace}:${JSON.stringify(filters ?? null)}`;
}

/**
 * Returns the cached value for `key` if present and not expired, otherwise calls `compute`,
 * caches the result for `ttlMs` (default 60s), and returns it.
 */
export async function getOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await compute();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
