import { describe, it, expect } from "vitest";
import { scoreTheory, matchMood, scoreTrend, scoreTrendBatch } from "@/lib/whatif/scoring";
import type { TrendInput } from "@/lib/whatif/types";

const SPORTS_TREND: TrendInput = {
  title: "RCB IPL auction strategy",
  traffic: "5000+",
  relatedQueries: ["IPL 2026 auction", "RCB retention list", "virat kohli"],
  url: "https://trends.google.com/trending/rss?geo=IN",
};

const TECH_NEGATIVE_TREND: TrendInput = {
  title: "OnePlus shutdown",
  traffic: "5000+",
  relatedQueries: ["OnePlus India CEO resigns", "OnePlus may shut down", "OnePlus India operations"],
  url: "https://trends.google.com/trending/rss?geo=IN",
};

const TECH_POSITIVE_TREND: TrendInput = {
  title: "iPhone 17 Pro breakthrough AI feature",
  traffic: "2000+",
  relatedQueries: ["iPhone 17 Pro launch", "Apple AI milestone", "record sales growth"],
  url: "https://trends.google.com/trending/rss?geo=US",
};

describe("scoring pipeline", () => {
  describe("scoreTheory", () => {
    it("ranks game_theory high for sports with strategy keywords", () => {
      const ranked = scoreTheory(SPORTS_TREND, "sports");
      expect(ranked.length).toBeGreaterThanOrEqual(3);
      expect(ranked[0].theory.id).toBeTruthy();
      expect(ranked[0].score).toBeGreaterThan(0);
      const gameTheoryRank = ranked.findIndex(r => r.theory.id === "game_theory");
      expect(gameTheoryRank).toBeLessThan(5);
    });

    it("ranks creative_destruction high for shutdown trend", () => {
      const ranked = scoreTheory(TECH_NEGATIVE_TREND, "tech");
      const cdRank = ranked.findIndex(r => r.theory.id === "creative_destruction");
      expect(cdRank).toBeLessThan(5);
    });

    it("returns at least 3 candidates", () => {
      const ranked = scoreTheory(SPORTS_TREND, "sports");
      expect(ranked.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("matchMood", () => {
    it("picks negative moods for negative trends", () => {
      const ranked = scoreTheory(TECH_NEGATIVE_TREND, "tech");
      const mood = matchMood(TECH_NEGATIVE_TREND, ranked[0].theory);
      expect(["shock", "fear", "anger", "drama"]).toContain(mood.mood.id);
    });

    it("picks positive moods for positive trends", () => {
      const ranked = scoreTheory(TECH_POSITIVE_TREND, "tech");
      const mood = matchMood(TECH_POSITIVE_TREND, ranked[0].theory);
      expect(["hype", "hope", "awe", "curiosity"]).toContain(mood.mood.id);
    });
  });

  describe("scoreTrend (full pipeline)", () => {
    it("returns theory + mood + scoreBreakdown", () => {
      const result = scoreTrend(SPORTS_TREND, "sports");
      expect(result.theory.id).toBeTruthy();
      expect(result.mood.id).toBeTruthy();
      expect(result.scoreBreakdown.theoryScore).toBeGreaterThan(0);
      expect(result.scoreBreakdown.moodScore).toBeGreaterThan(0);
    });

    it("is deterministic — same input gives same output", () => {
      const a = scoreTrend(SPORTS_TREND, "sports");
      const b = scoreTrend(SPORTS_TREND, "sports");
      expect(a.theory.id).toBe(b.theory.id);
      expect(a.mood.id).toBe(b.mood.id);
    });
  });
});

describe("batch diversity", () => {
  it("scoreTrendBatch avoids duplicate theories across a batch", () => {
    const trends: TrendInput[] = [
      { title: "OnePlus shutdown", traffic: "5000+", relatedQueries: ["CEO resigns", "shutdown"], url: "u" },
      { title: "Samsung collapse fears", traffic: "3000+", relatedQueries: ["market crash", "shutdown"], url: "u" },
      { title: "Xiaomi factory closure", traffic: "2000+", relatedQueries: ["closing down", "failure"], url: "u" },
    ];
    const results = scoreTrendBatch(trends, "tech");
    const theoryIds = results.map(r => r.theory.id);
    expect(new Set(theoryIds).size).toBe(3);
  });

  it("scoreTrendBatch returns correct number of results", () => {
    const trends: TrendInput[] = [
      { title: "trend 1", traffic: "1000+", relatedQueries: ["a"], url: "u" },
      { title: "trend 2", traffic: "2000+", relatedQueries: ["b"], url: "u" },
    ];
    const results = scoreTrendBatch(trends, "general");
    expect(results.length).toBe(2);
  });

  it("scoreTrendBatch each result has full structure", () => {
    const trends: TrendInput[] = [
      { title: "test trend", traffic: "1000+", relatedQueries: ["test"], url: "u" },
    ];
    const results = scoreTrendBatch(trends, "tech");
    expect(results[0].theory.id).toBeTruthy();
    expect(results[0].mood.id).toBeTruthy();
    expect(results[0].scoreBreakdown).toBeDefined();
  });
});
