/*
  In-memory rate limiter — sliding window, per-IP + global.

  - Per-IP: 30 requests per 60s (sliding window)
  - Global: 200 requests per 60s across all IPs
  - Returns { allowed, retryAfterMs } so the route can send 429 + Retry-After
  - Auto-cleans expired entries every 30s
  - Module-level Maps — same lifetime as the Next.js process (like cache.ts)
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Config ──
const IS_DEV = process.env.NODE_ENV === "development";
const PER_IP_LIMIT = IS_DEV ? 200 : 30; // relaxed in dev — homepage fires 15+ parallel requests
const GLOBAL_LIMIT = IS_DEV ? 1000 : 200;
const WINDOW_MS = 60_000; // 1 minute sliding window

// ── State ──
// Each IP maps to an array of request timestamps within the current window
const ipWindows = new Map<string, number[]>();
const globalWindow: number[] = [];

// ── Cleanup — evict stale IPs every 30s ──
const CLEANUP_KEY = "__newslens_ratelimit_cleanup";
if (!(globalThis as any)[CLEANUP_KEY]) {
  (globalThis as any)[CLEANUP_KEY] = setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [ip, timestamps] of ipWindows) {
      // Remove expired timestamps
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        ipWindows.delete(ip);
      } else {
        ipWindows.set(ip, fresh);
      }
    }
    // Trim global window
    const gCutoff = Date.now() - WINDOW_MS;
    while (globalWindow.length > 0 && globalWindow[0] <= gCutoff) {
      globalWindow.shift();
    }
  }, 30_000);
}

interface RateLimitResult {
  allowed: boolean;
  /** ms until the client can retry (0 if allowed) */
  retryAfterMs: number;
  /** which limit was hit: "ip" | "global" | null */
  limitType: "ip" | "global" | null;
  /** current count for diagnostics */
  ipCount: number;
  globalCount: number;
}

/**
 * Check and record a request against both per-IP and global rate limits.
 * Call this at the top of every API route handler.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // ── Trim global window ──
  while (globalWindow.length > 0 && globalWindow[0] <= cutoff) {
    globalWindow.shift();
  }

  // ── Trim per-IP window ──
  let timestamps = ipWindows.get(ip);
  if (timestamps) {
    // Filter in-place for efficiency
    const fresh = timestamps.filter((t) => t > cutoff);
    ipWindows.set(ip, fresh);
    timestamps = fresh;
  } else {
    timestamps = [];
    ipWindows.set(ip, timestamps);
  }

  // ── Check global limit first (cheaper to reject early) ──
  if (globalWindow.length >= GLOBAL_LIMIT) {
    const oldestGlobal = globalWindow[0];
    const retryAfterMs = oldestGlobal + WINDOW_MS - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 1000),
      limitType: "global",
      ipCount: timestamps.length,
      globalCount: globalWindow.length,
    };
  }

  // ── Check per-IP limit ──
  if (timestamps.length >= PER_IP_LIMIT) {
    const oldestIp = timestamps[0];
    const retryAfterMs = oldestIp + WINDOW_MS - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 1000),
      limitType: "ip",
      ipCount: timestamps.length,
      globalCount: globalWindow.length,
    };
  }

  // ── Allowed — record this request ──
  timestamps.push(now);
  globalWindow.push(now);

  return {
    allowed: true,
    retryAfterMs: 0,
    limitType: null,
    ipCount: timestamps.length,
    globalCount: globalWindow.length,
  };
}

/**
 * Extract client IP from a Next.js request.
 * Checks x-forwarded-for (Vercel, proxies), x-real-ip, then falls back to "unknown".
 */
export function getClientIp(req: { headers: Headers }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2" — take the first
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

/** Diagnostic — current rate limit state */
export function getRateLimitStats() {
  return {
    trackedIPs: ipWindows.size,
    globalWindowSize: globalWindow.length,
    perIpLimit: PER_IP_LIMIT,
    globalLimit: GLOBAL_LIMIT,
    windowMs: WINDOW_MS,
  };
}
