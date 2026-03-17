import { describe, it, expect } from "vitest";
import { getArticleRank, chakraLevel, translateUrl, COUNTRIES, LANGUAGES, CATEGORIES } from "@/components/trending/constants";

describe("getArticleRank", () => {
  it("returns S-RANK for articles less than 1 hour old", () => {
    const recent = new Date(Date.now() - 30 * 60000).toISOString(); // 30 min ago
    const rank = getArticleRank(recent);
    expect(rank.label).toBe("S-RANK");
    expect(rank.sub).toBe("BREAKING");
  });

  it("returns A-RANK for articles 1-3 hours old", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(getArticleRank(twoHoursAgo).label).toBe("A-RANK");
  });

  it("returns B-RANK for articles 3-12 hours old", () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 3600000).toISOString();
    expect(getArticleRank(sixHoursAgo).label).toBe("B-RANK");
  });

  it("returns C-RANK for articles over 12 hours old", () => {
    const dayAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    expect(getArticleRank(dayAgo).label).toBe("C-RANK");
  });
});

describe("chakraLevel", () => {
  it("returns ~1.0 for just-published articles", () => {
    const now = new Date().toISOString();
    expect(chakraLevel(now)).toBeGreaterThan(0.99);
  });

  it("returns ~0.5 for 12-hour-old articles", () => {
    const halfDay = new Date(Date.now() - 12 * 3600000).toISOString();
    const level = chakraLevel(halfDay);
    expect(level).toBeGreaterThan(0.45);
    expect(level).toBeLessThan(0.55);
  });

  it("returns 0 for 24h+ old articles", () => {
    const old = new Date(Date.now() - 48 * 3600000).toISOString();
    expect(chakraLevel(old)).toBe(0);
  });
});

describe("translateUrl", () => {
  it("generates correct Google Translate URL", () => {
    const url = translateUrl("https://example.com/article", "ta");
    expect(url).toContain("translate.google.com");
    expect(url).toContain("tl=ta");
    expect(url).toContain(encodeURIComponent("https://example.com/article"));
  });
});

describe("constants integrity", () => {
  it("has 12 countries", () => {
    expect(COUNTRIES).toHaveLength(12);
    expect(COUNTRIES.every((c) => c.code && c.label && c.flag)).toBe(true);
  });

  it("has India as first country", () => {
    expect(COUNTRIES[0].code).toBe("in");
  });

  it("has Tamil in languages with correct region", () => {
    const tamil = LANGUAGES.find((l) => l.code === "ta");
    expect(tamil).toBeDefined();
    expect(tamil?.region).toBe("Tamil Nadu");
  });

  it("has 9 categories", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect(CATEGORIES[0].id).toBe("general");
  });
});
