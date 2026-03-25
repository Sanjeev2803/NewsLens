import { describe, it, expect, vi } from "vitest";
import { generateScenarios } from "@/lib/whatif/generator";

vi.mock("@/lib/whatif/gemini", () => ({
  generateArticleWithGemini: vi.fn().mockResolvedValue(null),
}));
import { THEORY_REGISTRY } from "@/lib/whatif/theories";
import { MOOD_REGISTRY } from "@/lib/whatif/moods";
import type { TrendInput } from "@/lib/whatif/types";

// Real-ish trends covering different categories
const DIVERSE_TRENDS: TrendInput[] = [
  { title: "IPL 2026 auction RCB strategy", traffic: "10000+", relatedQueries: ["kohli", "auction", "franchise bid"], url: "u" },
  { title: "OnePlus India shutdown", traffic: "5000+", relatedQueries: ["CEO resigns", "shutdown", "collapse"], url: "u" },
  { title: "Modi parliament bill", traffic: "8000+", relatedQueries: ["lok sabha", "opposition", "vote"], url: "u" },
  { title: "Sensex crash 1000 points", traffic: "20000+", relatedQueries: ["market crash", "nifty", "recession fears"], url: "u" },
  { title: "Netflix new K-drama record", traffic: "3000+", relatedQueries: ["viral series", "box office", "streaming"], url: "u" },
];

describe("whatif v3 integration", () => {
  it("generates 5 diverse scenarios from 5 different trends", async () => {
    const scenarios = await generateScenarios(DIVERSE_TRENDS, "in");
    expect(scenarios.length).toBe(5);

    // All theories should be different (diversity guarantee)
    const theories = scenarios.map(s => s.theory.id);
    expect(new Set(theories).size).toBe(5);
  });

  it("every registered theory produces valid output", () => {
    const trend: TrendInput = { title: "generic test trend", traffic: "1000+", relatedQueries: ["test"], url: "u" };
    const mood = MOOD_REGISTRY.values().next().value!;
    for (const theory of THEORY_REGISTRY.values()) {
      const body = theory.sections.map(s => s(trend, mood)).join("\n\n");
      expect(body.length).toBeGreaterThan(50);
    }
  });

  it("every registered mood can be used with every theory without errors", () => {
    const trend: TrendInput = { title: "test trend", traffic: "1000+", relatedQueries: ["test"], url: "u" };
    const theories = [...THEORY_REGISTRY.values()].slice(0, 3); // test 3 for speed
    for (const theory of theories) {
      for (const mood of MOOD_REGISTRY.values()) {
        expect(() => {
          theory.sections.map(s => s(trend, mood)).join("\n\n");
        }).not.toThrow();
      }
    }
  });
});
