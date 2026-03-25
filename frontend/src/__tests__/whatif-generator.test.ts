import { describe, it, expect } from "vitest";
import { generateScenarios } from "@/lib/whatif/generator";
import type { TrendInput, GeneratedScenario } from "@/lib/whatif/types";

const TRENDS: TrendInput[] = [
  {
    title: "RCB IPL auction strategy",
    traffic: "5000+",
    relatedQueries: ["IPL 2026 auction", "RCB retention list", "virat kohli"],
    url: "https://trends.google.com/trending/rss?geo=IN",
  },
  {
    title: "OnePlus shutdown",
    traffic: "5000+",
    relatedQueries: ["OnePlus India CEO resigns", "shutdown operations"],
    url: "https://trends.google.com/trending/rss?geo=IN",
  },
];

describe("generator v3", () => {
  it("generates scenarios with theory and mood metadata", () => {
    const scenarios = generateScenarios(TRENDS, "in");
    expect(scenarios.length).toBe(2);
    for (const s of scenarios) {
      expect(s.theory).toBeDefined();
      expect(s.theory.id).toBeTruthy();
      expect(s.theory.name).toBeTruthy();
      expect(s.theory.voice).toBeTruthy();
      expect(s.mood).toBeDefined();
      expect(s.mood.id).toBeTruthy();
      expect(s.scoreBreakdown).toBeDefined();
    }
  });

  it("produces non-empty body content", () => {
    const scenarios = generateScenarios(TRENDS, "in");
    for (const s of scenarios) {
      expect(s.body.length).toBeGreaterThan(100);
    }
  });

  it("uses different theories for different trends in same batch", () => {
    const scenarios = generateScenarios(TRENDS, "in");
    if (scenarios.length >= 2) {
      expect(scenarios[0].theory.id).not.toBe(scenarios[1].theory.id);
    }
  });

  it("is deterministic", () => {
    const a = generateScenarios(TRENDS, "in");
    const b = generateScenarios(TRENDS, "in");
    expect(a[0].theory.id).toBe(b[0].theory.id);
    expect(a[0].mood.id).toBe(b[0].mood.id);
    expect(a[0].title).toBe(b[0].title);
  });

  it("preserves required GeneratedScenario fields", () => {
    const scenarios = generateScenarios(TRENDS, "in");
    for (const s of scenarios) {
      expect(s.title).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.body).toBeTruthy();
      expect(s.content_type).toBeTruthy();
      expect(s.read_time).toBeGreaterThan(0);
      expect(s.source_trend).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.is_ai_generated).toBe(true);
      expect(s.country).toBe("in");
      expect(s.outcomes.length).toBeGreaterThan(0);
    }
  });
});
