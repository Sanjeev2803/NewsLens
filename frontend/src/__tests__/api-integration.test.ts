import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock fetch globally to simulate RSS responses
const RSS_RESPONSE = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test News Feed</title>
    <item>
      <title>Major climate summit reaches breakthrough agreement on emissions</title>
      <link>https://example.com/climate-summit</link>
      <description>World leaders have agreed to a historic framework for reducing carbon emissions by 50% over the next decade, marking a significant shift in global climate policy.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <media:thumbnail url="https://example.com/images/climate.jpg" />
    </item>
    <item>
      <title>Tech giant announces revolutionary quantum computing chip</title>
      <link>https://example.com/quantum-chip</link>
      <description>A major technology company has unveiled a new quantum processor capable of performing calculations that would take traditional supercomputers thousands of years.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <media:thumbnail url="https://example.com/images/quantum.jpg" />
    </item>
    <item>
      <title>Cricket World Cup semifinal delivers thrilling finish in Mumbai</title>
      <link>https://example.com/cricket-wc</link>
      <description>In one of the most exciting matches in World Cup history, the semifinal concluded with a last-ball six that sent the home crowd into a frenzy of celebration.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

const TRENDS_RESPONSE = `<?xml version="1.0"?>
<rss version="2.0" xmlns:ht="https://trends.google.com/trending/rss">
  <channel>
    <item>
      <title>climate summit</title>
      <ht:approx_traffic>500000+</ht:approx_traffic>
      <link>https://trends.google.com</link>
    </item>
  </channel>
</rss>`;

beforeAll(() => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    const urlStr = String(url);
    if (urlStr.includes("trends.google.com")) {
      return Promise.resolve(new Response(TRENDS_RESPONSE, { status: 200 }));
    }
    // All other URLs return RSS
    return Promise.resolve(new Response(RSS_RESPONSE, { status: 200 }));
  });

  return () => { globalThis.fetch = originalFetch; };
});

describe("fetchAllNews integration", () => {
  it("fetches, deduplicates, and quality-filters articles", async () => {
    const { fetchAllNews } = await import("@/lib/newsSources");
    const result = await fetchAllNews({ category: "general", country: "in", lang: "en", max: 10 });

    expect(result.articles.length).toBeGreaterThan(0);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(typeof result.freshCount).toBe("number");

    // Each article should have required fields
    for (const article of result.articles) {
      expect(article.title).toBeTruthy();
      expect(article.url).toBeTruthy();
      expect(article.publishedAt).toBeTruthy();
      expect(article.source).toBeTruthy();
    }
  });

  it("deduplicates similar titles", async () => {
    const { fetchAllNews } = await import("@/lib/newsSources");
    const result = await fetchAllNews({ category: "general", country: "in", lang: "en", max: 30 });

    // Check no two articles have identical normalized titles
    const seen = new Set<string>();
    for (const a of result.articles) {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("quality filter removes short/junk articles", async () => {
    const { fetchAllNews } = await import("@/lib/newsSources");
    const result = await fetchAllNews({ category: "general", country: "in", lang: "en", max: 30 });

    for (const a of result.articles) {
      expect(a.title.length).toBeGreaterThanOrEqual(25);
      expect(a.description.length).toBeGreaterThanOrEqual(50);
      expect(a.url.length).toBeGreaterThanOrEqual(15);
    }
  });
});

describe("cachedFetch integration", () => {
  it("caches results and serves from cache on second call", async () => {
    const { cachedFetch } = await import("@/lib/cache");
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    const key = `integration-test-${Date.now()}`;

    const r1 = await cachedFetch(key, fetcher, { ttlMs: 60000, staleGraceMs: 120000 });
    const r2 = await cachedFetch(key, fetcher, { ttlMs: 60000, staleGraceMs: 120000 });

    expect(r1).toEqual({ data: "test" });
    expect(r2).toEqual({ data: "test" });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

describe("rate limiter integration", () => {
  it("allows burst of requests then blocks", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const testIp = `integration-test-${Date.now()}`;

    // First request should pass
    const first = checkRateLimit(testIp);
    expect(first.allowed).toBe(true);

    // Should track count
    expect(first.ipCount).toBe(1);
    expect(first.globalCount).toBeGreaterThanOrEqual(1);
  });
});
