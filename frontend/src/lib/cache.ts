/*
  In-memory cache with Stale-While-Revalidate (SWR) pattern.

  - Serves cached data instantly within TTL
  - Serves stale data while refreshing in background (grace period)
  - Coalesces duplicate in-flight requests (same key = same Promise)
  - Auto-cleans expired entries every 60s

  This eliminates 50+ duplicate outbound calls per request cycle.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  ttl: number;
  staleGrace: number;
}

// Module-level singletons — persist across requests in the same Next.js process
const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

// Prevent duplicate cleanup intervals during HMR
const CLEANUP_KEY = "__newslens_cache_cleanup";
if (!(globalThis as any)[CLEANUP_KEY]) {
  (globalThis as any)[CLEANUP_KEY] = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.createdAt > entry.ttl + entry.staleGrace) {
        store.delete(key);
      }
    }
  }, 60_000);
}

// Background revalidation — fire and forget
function revalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  staleGrace: number
): void {
  if (inflight.has(key)) return; // already revalidating

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, createdAt: Date.now(), ttl, staleGrace });
    })
    .catch((err) => {
      console.warn(`[cache] background revalidation failed for "${key}":`, err);
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
}

/**
 * Get cached data or fetch it. Implements stale-while-revalidate:
 * - FRESH (within TTL): return instantly, no fetch
 * - STALE (within grace): return instantly + refresh in background
 * - EXPIRED / MISS: fetch, cache, return
 * - COALESCED: if same key is already being fetched, share the Promise
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs: number; staleGraceMs: number }
): Promise<T> {
  const { ttlMs, staleGraceMs } = options;
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry) {
    const age = Date.now() - entry.createdAt;

    // FRESH — serve immediately
    if (age < entry.ttl) {
      return entry.data;
    }

    // STALE but within grace — serve stale, revalidate in background
    if (age < entry.ttl + entry.staleGrace) {
      revalidate(key, fetcher, ttlMs, staleGraceMs);
      return entry.data;
    }

    // EXPIRED — delete, treat as miss
    store.delete(key);
  }

  // CACHE MISS — check for in-flight request (coalescing)
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // No cache, no in-flight — fetch fresh
  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, createdAt: Date.now(), ttl: ttlMs, staleGrace: staleGraceMs });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      // If we have expired stale data, re-cache briefly to prevent thundering herd
      if (entry) {
        store.set(key, { data: entry.data, createdAt: Date.now(), ttl: 30_000, staleGrace: 0 });
        return entry.data;
      }
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

/** Diagnostic — call from API route with ?_cache=status */
export function getCacheStats() {
  const entries: Record<string, { ageSeconds: number; fresh: boolean }> = {};
  const now = Date.now();
  for (const [key, entry] of store) {
    const age = now - entry.createdAt;
    entries[key] = {
      ageSeconds: Math.round(age / 1000),
      fresh: age < entry.ttl,
    };
  }
  return {
    totalEntries: store.size,
    inflightRequests: inflight.size,
    entries,
  };
}
