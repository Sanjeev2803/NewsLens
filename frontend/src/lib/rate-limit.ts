/*
  Dual-mode rate limiter: Redis (Upstash) when available, in-memory fallback.

  - Per-IP: 30 requests per 60s (prod), 200 in dev
  - Global: 200 requests per 60s (prod), 1000 in dev
  - Redis mode: shared across all serverless instances (sliding window via Upstash)
  - Memory mode: per-process fixed window (dev/single instance)
  - Auto-cleans stale IPs every 30s in memory mode
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Ratelimit } from "@upstash/ratelimit";
import { getSharedRedis } from "./redis";

// ── Config ──
const IS_DEV = process.env.NODE_ENV === "development";
const PER_IP_LIMIT = IS_DEV ? 200 : 30;
const GLOBAL_LIMIT = IS_DEV ? 1000 : 200;
const WINDOW_MS = 60_000;

// ── Redis rate limiter (lazy init, uses shared Redis client) ──

let ipRatelimit: Ratelimit | null = null;
let globalRatelimit: Ratelimit | null = null;

function getRedisRatelimits(): { ip: Ratelimit; global: Ratelimit } | null {
  if (ipRatelimit && globalRatelimit) return { ip: ipRatelimit, global: globalRatelimit };

  const redis = getSharedRedis();
  if (!redis) return null;

  try {
    ipRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(PER_IP_LIMIT, "60 s"),
      prefix: "rl:ip",
    });

    globalRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(GLOBAL_LIMIT, "60 s"),
      prefix: "rl:global",
    });

    return { ip: ipRatelimit, global: globalRatelimit };
  } catch {
    return null;
  }
}

// ── In-memory fallback ──

interface WindowCounter {
  count: number;
  windowStart: number;
}

const ipCounters = new Map<string, WindowCounter>();
let globalCounter: WindowCounter = { count: 0, windowStart: Date.now() };

function getCounter(counter: WindowCounter, now: number): WindowCounter {
  if (now - counter.windowStart >= WINDOW_MS) {
    counter.count = 0;
    counter.windowStart = now;
  }
  return counter;
}

const CLEANUP_KEY = "__newslens_ratelimit_cleanup";
if (!(globalThis as any)[CLEANUP_KEY]) {
  (globalThis as any)[CLEANUP_KEY] = setInterval(() => {
    const now = Date.now();
    for (const [ip, counter] of ipCounters) {
      if (now - counter.windowStart >= WINDOW_MS) {
        ipCounters.delete(ip);
      }
    }
  }, 30_000);
}

// ── Public API ──

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  limitType: "ip" | "global" | null;
  ipCount: number;
  globalCount: number;
}

export async function checkRateLimitAsync(ip: string): Promise<RateLimitResult> {
  const rl = getRedisRatelimits();
  if (rl) {
    // Redis mode — check global first, only consume IP budget if global passes
    const globalResult = await rl.global.limit("global");

    if (!globalResult.success) {
      return {
        allowed: false,
        retryAfterMs: Math.max((globalResult.reset - Date.now()), 1000),
        limitType: "global",
        ipCount: 0,
        globalCount: globalResult.remaining,
      };
    }

    const ipResult = await rl.ip.limit(ip);

    if (!ipResult.success) {
      return {
        allowed: false,
        retryAfterMs: Math.max((ipResult.reset - Date.now()), 1000),
        limitType: "ip",
        ipCount: ipResult.remaining,
        globalCount: globalResult.remaining,
      };
    }

    return {
      allowed: true,
      retryAfterMs: 0,
      limitType: null,
      ipCount: PER_IP_LIMIT - ipResult.remaining,
      globalCount: GLOBAL_LIMIT - globalResult.remaining,
    };
  }

  // Fallback to in-memory
  return checkRateLimit(ip);
}

/** Synchronous in-memory rate limiter (always available) */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  globalCounter = getCounter(globalCounter, now);

  let ipCounter = ipCounters.get(ip);
  if (!ipCounter) {
    ipCounter = { count: 0, windowStart: now };
    ipCounters.set(ip, ipCounter);
  }
  ipCounter = getCounter(ipCounter, now);

  if (globalCounter.count >= GLOBAL_LIMIT) {
    const retryAfterMs = (globalCounter.windowStart + WINDOW_MS) - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 1000),
      limitType: "global",
      ipCount: ipCounter.count,
      globalCount: globalCounter.count,
    };
  }

  if (ipCounter.count >= PER_IP_LIMIT) {
    const retryAfterMs = (ipCounter.windowStart + WINDOW_MS) - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 1000),
      limitType: "ip",
      ipCount: ipCounter.count,
      globalCount: globalCounter.count,
    };
  }

  ipCounter.count++;
  globalCounter.count++;

  return {
    allowed: true,
    retryAfterMs: 0,
    limitType: null,
    ipCount: ipCounter.count,
    globalCount: globalCounter.count,
  };
}

export function getClientIp(req: { headers: Headers }): string {
  // x-real-ip is set by Vercel/reverse proxies and can't be spoofed by clients
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // x-forwarded-for can be spoofed — take the last entry (closest proxy)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim());
    return parts[parts.length - 1] || "unknown";
  }

  return "unknown";
}

export function getRateLimitStats() {
  return {
    trackedIPs: ipCounters.size,
    globalWindowSize: globalCounter.count,
    perIpLimit: PER_IP_LIMIT,
    globalLimit: GLOBAL_LIMIT,
    windowMs: WINDOW_MS,
    redisEnabled: !!getRedisRatelimits(),
  };
}
