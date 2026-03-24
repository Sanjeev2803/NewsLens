/*
  Shared Redis (Upstash) singleton used by cache.ts and rate-limit.ts.
  Retries connection after 30s cooldown on failure.
*/

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let redisAvailable = true;
let redisRetryAt = 0;
const REDIS_RETRY_MS = 30_000;

export function getSharedRedis(): Redis | null {
  if (!redisAvailable) {
    if (Date.now() < redisRetryAt) return null;
    redisAvailable = true;
    redis = null;
  }
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisAvailable = false;
    redisRetryAt = Infinity;
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
