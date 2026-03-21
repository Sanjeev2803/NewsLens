import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIp, getRateLimitStats } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const ip = `test-allow-${Date.now()}`;
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
    expect(result.limitType).toBeNull();
    expect(result.ipCount).toBe(1);
  });

  it("tracks request counts per IP", () => {
    const ip = `test-count-${Date.now()}`;
    checkRateLimit(ip);
    checkRateLimit(ip);
    const result = checkRateLimit(ip);
    expect(result.ipCount).toBe(3);
  });

  it("isolates different IPs", () => {
    const ip1 = `test-iso1-${Date.now()}`;
    const ip2 = `test-iso2-${Date.now()}`;
    checkRateLimit(ip1);
    checkRateLimit(ip1);
    const r2 = checkRateLimit(ip2);
    expect(r2.ipCount).toBe(1);
  });

  it("increments global counter", () => {
    const base = `test-global-${Date.now()}`;
    const r1 = checkRateLimit(`${base}-a`);
    const r2 = checkRateLimit(`${base}-b`);
    expect(r2.globalCount).toBeGreaterThan(r1.globalCount);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp({ headers })).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "9.8.7.6" });
    expect(getClientIp({ headers })).toBe("9.8.7.6");
  });

  it("falls back to unknown", () => {
    const headers = new Headers();
    expect(getClientIp({ headers })).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.1.1.1",
      "x-real-ip": "2.2.2.2",
    });
    expect(getClientIp({ headers })).toBe("1.1.1.1");
  });
});

describe("getRateLimitStats", () => {
  it("reports current state", () => {
    const stats = getRateLimitStats();
    expect(stats).toHaveProperty("trackedIPs");
    expect(stats).toHaveProperty("globalWindowSize");
    expect(stats).toHaveProperty("perIpLimit");
    expect(stats).toHaveProperty("globalLimit");
    expect(stats).toHaveProperty("windowMs");
    expect(stats.windowMs).toBe(60_000);
  });
});
