import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("redis singleton", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when env vars are missing", async () => {
    const { getSharedRedis } = await import("@/lib/redis");
    expect(getSharedRedis()).toBeNull();
  });

  it("health check returns not ok when Redis is unavailable", async () => {
    const { redisHealthCheck } = await import("@/lib/redis");
    const result = await redisHealthCheck();
    expect(result.ok).toBe(false);
    expect(result.latencyMs).toBeNull();
  });

  it("logs warning once for missing credentials", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getSharedRedis } = await import("@/lib/redis");
    getSharedRedis();
    getSharedRedis();
    getSharedRedis();
    // Should only log once, not on every call
    const redisCalls = warnSpy.mock.calls.filter(c => String(c[0]).includes("[redis]"));
    expect(redisCalls.length).toBeLessThanOrEqual(1);
    warnSpy.mockRestore();
  });
});
