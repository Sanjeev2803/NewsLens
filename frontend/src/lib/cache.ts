/*
  Dual-mode cache: Redis (Upstash) when credentials exist, in-memory fallback otherwise.

  - Stale-While-Revalidate (SWR) pattern in both modes
  - Request coalescing for duplicate in-flight fetches
  - Shared across serverless instances when Redis is active
  - Automatic fallback to in-memory if Redis is unavailable or errors

  Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local to enable Redis.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Redis } from "@upstash/redis";

// ── Redis client (lazy singleton) ──

let redis: Redis | null = null;
let redisAvailable = true;

function getRedis(): Redis | null {
  if (!redisAvailable) return null;
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisAvailable = false;
    console.log("[cache] No Upstash credentials — using in-memory cache");
    return null;
  }

  try {
    redis = new Redis({ url, token });
    console.log("[cache] Redis connected (Upstash)");
    return redis;
  } catch (err) {
    console.warn("[cache] Redis init failed, falling back to in-memory:", err);
    redisAvailable = false;
    return null;
  }
}

// ── In-memory store (fallback) ──

interface MemEntry {
  data: unknown;
  createdAt: number;
  ttl: number;
  staleGrace: number;
}

const memStore = new Map<string, MemEntry>();
const inflight = new Map<string, Promise<unknown>>();

// Cleanup stale entries every 60s (prevents memory leaks in long-running processes)
const CLEANUP_KEY = "__newslens_cache_cleanup";
if (!(globalThis as any)[CLEANUP_KEY]) {
  (globalThis as any)[CLEANUP_KEY] = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore) {
      if (now - entry.createdAt > entry.ttl + entry.staleGrace) {
        memStore.delete(key);
      }
    }
  }, 60_000);
}

// ── Redis helpers ──

interface RedisEntry {
  data: unknown;
  createdAt: number;
}

async function redisGet(key: string): Promise<RedisEntry | null> {
  const r = getRedis();
  if (!r) return null;

  try {
    const raw = await r.get<RedisEntry>(key);
    return raw ?? null;
  } catch (err) {
    console.warn("[cache] Redis GET failed:", err);
    return null;
  }
}

async function redisSet(key: string, data: unknown, createdAt: number, totalTtlMs: number): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    // Store with TTL = fresh + stale grace (Redis auto-expires)
    const ttlSeconds = Math.ceil(totalTtlMs / 1000);
    await r.set(key, { data, createdAt } satisfies RedisEntry, { ex: ttlSeconds });
  } catch (err) {
    console.warn("[cache] Redis SET failed:", err);
  }
}

// NOTE: Non-atomic read-modify-write. Concurrent updates across instances may overwrite
// each other. Acceptable for enrichment updates — worst case is a stale image URL for one
// cache cycle. A Redis Lua script would fix this but adds complexity for minimal gain.
async function redisUpdate(key: string, updater: (data: any) => any): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    const existing = await r.get<RedisEntry>(key);
    if (existing) {
      const ttl = await r.ttl(key);
      const updated = { ...existing, data: updater(existing.data) };
      if (ttl > 0) {
        await r.set(key, updated, { ex: ttl });
      }
    }
  } catch (err) {
    console.warn("[cache] Redis UPDATE failed:", err);
  }
}

// ── Background revalidation (fire and forget) ──

function revalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  staleGraceMs: number
): void {
  if (inflight.has(key)) return;

  const promise = fetcher()
    .then(async (data) => {
      // Write to both stores
      const now = Date.now();
      memStore.set(key, { data, createdAt: now, ttl: ttlMs, staleGrace: staleGraceMs });
      await redisSet(key, data, now, ttlMs + staleGraceMs);
    })
    .catch((err) => {
      console.warn(`[cache] background revalidation failed for "${key}":`, err);
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
}

// ── Public API ──

/**
 * Get cached data or fetch it. Implements stale-while-revalidate:
 * - FRESH (within TTL): return instantly, no fetch
 * - STALE (within grace): return instantly + refresh in background
 * - EXPIRED / MISS: fetch, cache, return
 * - COALESCED: if same key is already being fetched, share the Promise
 *
 * Checks Redis first (shared), then in-memory (local), then fetches.
 */
export function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs: number; staleGraceMs: number }
): Promise<T> {
  const { ttlMs, staleGraceMs } = options;
  const now = Date.now();

  // ── Check in-memory first (fastest, synchronous) ──
  const memEntry = memStore.get(key) as MemEntry | undefined;
  if (memEntry) {
    const age = now - memEntry.createdAt;
    if (age < memEntry.ttl) return Promise.resolve(memEntry.data as T);
    if (age < memEntry.ttl + memEntry.staleGrace) {
      revalidate(key, fetcher, ttlMs, staleGraceMs);
      return Promise.resolve(memEntry.data as T);
    }
    memStore.delete(key);
  }

  // ── Coalesce: if someone is already fetching this key, share the promise ──
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  // ── Cache miss — register promise synchronously, then do async work ──
  const hasRedis = !!getRedis();
  const promise = (async () => {
    // Check Redis (shared across instances) — skip async call if no Redis
    const redisEntry = hasRedis ? await redisGet(key) : null;
    if (redisEntry) {
      const age = Date.now() - redisEntry.createdAt;
      memStore.set(key, { data: redisEntry.data, createdAt: redisEntry.createdAt, ttl: ttlMs, staleGrace: staleGraceMs });

      if (age < ttlMs) return redisEntry.data as T;
      if (age < ttlMs + staleGraceMs) {
        revalidate(key, fetcher, ttlMs, staleGraceMs);
        return redisEntry.data as T;
      }
      // Expired in Redis too — fall through to fetch
    }

    try {
      const data = await fetcher();
      const fetchedAt = Date.now();
      memStore.set(key, { data, createdAt: fetchedAt, ttl: ttlMs, staleGrace: staleGraceMs });
      await redisSet(key, data, fetchedAt, ttlMs + staleGraceMs);
      return data;
    } catch (err) {
      // Serve stale data if available (thundering herd protection)
      const stale = memEntry || redisEntry;
      if (stale) {
        memStore.set(key, { data: stale.data, createdAt: Date.now(), ttl: 30_000, staleGrace: 0 });
        return stale.data as T;
      }
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Update an existing cache entry in-place (e.g., after background enrichment) */
export function updateCacheEntry<T>(key: string, updater: (data: T) => T): void {
  // Update in-memory
  const entry = memStore.get(key) as MemEntry | undefined;
  if (entry) {
    entry.data = updater(entry.data as T);
  }
  // Update Redis (async, fire-and-forget)
  redisUpdate(key, updater);
}

/** Diagnostic — call from API route with ?_cache=status */
export function getCacheStats() {
  const entries: Record<string, { ageSeconds: number; fresh: boolean }> = {};
  const now = Date.now();
  for (const [key, entry] of memStore) {
    const age = now - entry.createdAt;
    entries[key] = {
      ageSeconds: Math.round(age / 1000),
      fresh: age < entry.ttl,
    };
  }
  return {
    totalEntries: memStore.size,
    inflightRequests: inflight.size,
    redisConnected: !!getRedis(),
    entries,
  };
}

/**
 * Directly set a cache entry (used by cron pre-fetcher to warm cache).
 */
export async function setCacheEntry<T>(
  key: string,
  data: T,
  options: { ttlMs: number; staleGraceMs: number }
): Promise<void> {
  const now = Date.now();
  memStore.set(key, { data, createdAt: now, ttl: options.ttlMs, staleGrace: options.staleGraceMs });
  await redisSet(key, data, now, options.ttlMs + options.staleGraceMs);
}
