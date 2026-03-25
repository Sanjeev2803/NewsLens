import { describe, it, expect } from "vitest";
import type {
  Theory,
  Mood,
  SectionBuilder,
  OutcomeSet,
  TrendInput,
  GeneratedScenario,
  ScoreBreakdown,
} from "@/lib/whatif/types";

describe("whatif v3 types", () => {
  it("TrendInput has required fields", () => {
    const trend: TrendInput = {
      title: "test",
      traffic: "1000+",
      relatedQueries: ["a", "b"],
      url: "https://example.com",
    };
    expect(trend.title).toBe("test");
  });

  it("GeneratedScenario includes theory and mood metadata", () => {
    const scenario = {
      title: "test",
      description: "desc",
      body: "body",
      content_type: "article",
      read_time: 3,
      source_trend: "trend",
      source_trend_url: "url",
      category: "tech",
      is_ai_generated: true,
      country: "in",
      outcomes: [{ label: "A", description: "desc" }],
      theory: { id: "game_theory", name: "Game Theory", voice: "strategist DM" },
      mood: { id: "suspense", name: "Suspense", group: "high_energy" },
      scoreBreakdown: {
        theoryScore: 0.85,
        moodScore: 0.72,
        affinityHit: 0.9,
        keywordHits: ["auction", "strategy"],
      },
    } satisfies GeneratedScenario;
    expect(scenario.theory.id).toBe("game_theory");
    expect(scenario.mood.id).toBe("suspense");
    expect(scenario.scoreBreakdown.keywordHits).toHaveLength(2);
  });
});
