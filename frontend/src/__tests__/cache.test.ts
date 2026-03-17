import { describe, it, expect, vi } from "vitest";
import { cachedFetch, getCacheStats } from "@/lib/cache";

describe("cachedFetch", () => {
  it("returns fetched data on cache miss", async () => {
    const fetcher = vi.fn().mockResolvedValue({ articles: [1, 2, 3] });

    const result = await cachedFetch("test:miss:" + Date.now(), fetcher, {
      ttlMs: 60000,
      staleGraceMs: 120000,
    });

    expect(result).toEqual({ articles: [1, 2, 3] });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns cached data on second call within TTL", async () => {
    const key = "test:ttl:" + Date.now();
    const fetcher = vi.fn().mockResolvedValue({ data: "fresh" });

    await cachedFetch(key, fetcher, { ttlMs: 60000, staleGraceMs: 120000 });
    const result = await cachedFetch(key, fetcher, { ttlMs: 60000, staleGraceMs: 120000 });

    expect(result).toEqual({ data: "fresh" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("coalesces duplicate in-flight requests", async () => {
    const key = "test:coalesce:" + Date.now();
    let resolvePromise: (v: string) => void;
    const fetcher = vi.fn().mockImplementation(
      () => new Promise<string>((resolve) => { resolvePromise = resolve; })
    );

    const p1 = cachedFetch(key, fetcher, { ttlMs: 60000, staleGraceMs: 120000 });
    const p2 = cachedFetch(key, fetcher, { ttlMs: 60000, staleGraceMs: 120000 });

    resolvePromise!("shared");

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe("shared");
    expect(r2).toBe("shared");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("uses different cache entries for different keys", async () => {
    const fetcher1 = vi.fn().mockResolvedValue("result-a");
    const fetcher2 = vi.fn().mockResolvedValue("result-b");

    const a = await cachedFetch("test:key-a:" + Date.now(), fetcher1, { ttlMs: 60000, staleGraceMs: 120000 });
    const b = await cachedFetch("test:key-b:" + Date.now(), fetcher2, { ttlMs: 60000, staleGraceMs: 120000 });

    expect(a).toBe("result-a");
    expect(b).toBe("result-b");
  });
});

describe("getCacheStats", () => {
  it("reports cache entries", async () => {
    const key = "test:stats:" + Date.now();
    await cachedFetch(key, () => Promise.resolve("data"), {
      ttlMs: 60000,
      staleGraceMs: 120000,
    });

    const stats = getCacheStats();
    expect(stats.totalEntries).toBeGreaterThanOrEqual(1);
    expect(stats.entries[key]).toBeDefined();
    expect(stats.entries[key].fresh).toBe(true);
  });
});
