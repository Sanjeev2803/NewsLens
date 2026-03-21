/*
  In-memory rate limiter — fixed-window counters, per-IP + global.

  - Per-IP: 30 requests per 60s (prod), 200 in dev
  - Global: 200 requests per 60s (prod), 1000 in dev
  - O(1) per request — no arrays, no shifting
  - Auto-cleans stale IPs every 30s
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Config ──
const IS_DEV = process.env.NODE_ENV === "development";
const PER_IP_LIMIT = IS_DEV ? 200 : 30;
const GLOBAL_LIMIT = IS_DEV ? 1000 : 200;
const WINDOW_MS = 60_000;

// ── State ──
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

// ── Cleanup — evict stale IPs every 30s ──
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

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  limitType: "ip" | "global" | null;
  ipCount: number;
  globalCount: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  // ── Reset global window if expired ──
  globalCounter = getCounter(globalCounter, now);

  // ── Get or create IP counter ──
  let ipCounter = ipCounters.get(ip);
  if (!ipCounter) {
    ipCounter = { count: 0, windowStart: now };
    ipCounters.set(ip, ipCounter);
  }
  ipCounter = getCounter(ipCounter, now);

  // ── Check global limit ──
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

  // ── Check per-IP limit ──
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

  // ── Allowed ──
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
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export function getRateLimitStats() {
  return {
    trackedIPs: ipCounters.size,
    globalWindowSize: globalCounter.count,
    perIpLimit: PER_IP_LIMIT,
    globalLimit: GLOBAL_LIMIT,
    windowMs: WINDOW_MS,
  };
}
