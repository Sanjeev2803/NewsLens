/*
  Shared Redis (Upstash) singleton used by cache.ts and rate-limit.ts.
  - Retries connection after 30s cooldown on transient failure
  - Logs missing credentials once (no retry — they won't appear at runtime)
  - Exposes health check for monitoring
*/

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let redisAvailable = true;
let redisRetryAt = 0;
let credentialsMissing = false;
const REDIS_RETRY_MS = 30_000;

export function getSharedRedis(): Redis | null {
  // Credentials are never going to appear mid-process — skip retries
  if (credentialsMissing) return null;

  if (!redisAvailable) {
    if (Date.now() < redisRetryAt) return null;
    // Cooldown expired — retry
    redisAvailable = true;
    redis = null;
  }
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    credentialsMissing = true;
    console.warn("[redis] UPSTASH_REDIS_REST_URL or TOKEN not set — running in memory-only mode");
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch {
    redisAvailable = false;
    redisRetryAt = Date.now() + REDIS_RETRY_MS;
    return null;
  }
}

/** Ping Redis to verify connectivity. Returns latency in ms or null if unavailable. */
export async function redisHealthCheck(): Promise<{ ok: boolean; latencyMs: number | null }> {
  const r = getSharedRedis();
  if (!r) return { ok: false, latencyMs: null };

  const start = Date.now();
  try {
    await r.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    console.error("[redis] health check failed:", err);
    redisAvailable = false;
    redisRetryAt = Date.now() + REDIS_RETRY_MS;
    redis = null;
    return { ok: false, latencyMs: null };
  }
}
