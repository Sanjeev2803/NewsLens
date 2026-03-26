import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external fetchers before importing the route
vi.mock("@/lib/newsSources", () => ({
  fetchAllNews: vi.fn().mockResolvedValue({
    articles: [
      { title: "Test Article 1", description: "Desc 1", url: "https://example.com/1", image: null, publishedAt: new Date().toISOString(), source: { name: "Test", url: "" } },
      { title: "Test Article 2", description: "Desc 2", url: "https://example.com/2", image: "https://img.com/2.jpg", publishedAt: new Date().toISOString(), source: { name: "Test2", url: "" } },
    ],
    sources: ["Source1", "Source2"],
    freshCount: 1,
  }),
}));

vi.mock("@/lib/socialSources", () => ({
  fetchAllSocial: vi.fn().mockResolvedValue({
    posts: [{ title: "Reddit post", platform: "reddit", score: 100 }],
    platforms: ["reddit"],
  }),
}));

vi.mock("@/lib/regionalSources", () => ({
  fetchGoogleTrends: vi.fn().mockResolvedValue([
    { title: "Trending 1", traffic: "100K+", relatedQueries: [], url: "https://trends.google.com/1" },
  ]),
  fetchRegionalFeeds: vi.fn().mockResolvedValue({ articles: [], sources: [] }),
  getRegionalGeo: vi.fn().mockReturnValue("IN-TN"),
  getGeoForCountry: vi.fn().mockReturnValue("US"),
  LANGUAGE_STATE_MAP: {
    ta: { states: ["Tamil Nadu", "Puducherry"], geoCode: "IN-TN" },
    te: { states: ["Andhra Pradesh", "Telangana"], geoCode: "IN-TG" },
    hi: { states: ["Delhi", "Uttar Pradesh"], geoCode: "IN-DL" },
  },
}));

vi.mock("@/lib/cache", () => ({
  setCacheEntry: vi.fn().mockResolvedValue(undefined),
  CACHE_TTLS: {
    news:   { ttlMs: 2 * 60 * 1000, staleGraceMs: 5 * 60 * 1000 },
    social: { ttlMs: 3 * 60 * 1000, staleGraceMs: 5 * 60 * 1000 },
    batch:  { ttlMs: 2 * 60 * 1000, staleGraceMs: 5 * 60 * 1000 },
    whatif: null,
  },
}));

vi.mock("@/lib/imageEnrich", () => ({
  enrichArticleImages: vi.fn().mockImplementation((articles) => Promise.resolve(articles)),
}));

vi.mock("@/lib/newsAssemble", () => ({
  assembleNewsFeed: vi.fn().mockReturnValue({
    articles: [],
    sources: [],
    trends: [],
  }),
}));

import { GET } from "@/app/api/cron/warm-cache/route";
import { NextRequest } from "next/server";
import { setCacheEntry } from "@/lib/cache";

function createRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/cron/warm-cache", { headers });
}

describe("/api/cron/warm-cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No CRON_SECRET set — allows unauthenticated access in test
    delete process.env.CRON_SECRET;
  });

  it("warms cache for all configured combos", async () => {
    const res = await GET(createRequest());
    const data = await res.json();

    expect(data.status).toBe("completed");
    expect(data.results.length).toBe(12); // 12 WARM_COMBOS
    expect(data.results.every((r: { status: string }) => r.status === "ok")).toBe(true);
    expect(data.totalMs).toBeGreaterThanOrEqual(0);
  });

  it("calls setCacheEntry for each combo (news + social)", async () => {
    await GET(createRequest());

    // 12 news + 12 social = 24 cache writes
    expect(setCacheEntry).toHaveBeenCalledTimes(24);
  });

  it("rejects unauthorized requests when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "test-secret-123";

    const res = await GET(createRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("allows authorized requests with correct bearer token", async () => {
    process.env.CRON_SECRET = "test-secret-123";

    const res = await GET(createRequest({ authorization: "Bearer test-secret-123" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("completed");
  });
});
