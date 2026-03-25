import { describe, it, expect } from "vitest";
import { THEORY_REGISTRY, getTheory } from "@/lib/whatif/theories";
import { getMood } from "@/lib/whatif/moods";
import type { TrendInput } from "@/lib/whatif/types";

const MOCK_TREND: TrendInput = {
  title: "RCB IPL auction strategy",
  traffic: "5000+",
  relatedQueries: ["IPL 2026 auction", "RCB retention list", "virat kohli"],
  url: "https://trends.google.com/trending/rss?geo=IN",
};

describe("theories registry", () => {
  it("has at least 5 theories", () => {
    expect(THEORY_REGISTRY.size).toBeGreaterThanOrEqual(5);
  });

  it("each theory has required fields", () => {
    for (const [id, theory] of THEORY_REGISTRY) {
      expect(theory.id).toBe(id);
      expect(theory.name).toBeTruthy();
      expect(theory.group).toBeTruthy();
      expect(theory.voice).toBeTruthy();
      expect(theory.rhythm).toBeTruthy();
      expect(theory.readerRelationship).toBeTruthy();
      expect(theory.sections.length).toBeGreaterThan(0);
      expect(theory.outcomes.length).toBeGreaterThan(0);
      expect(Object.keys(theory.affinities).length).toBeGreaterThan(0);
      expect(theory.keywords.length).toBeGreaterThan(0);
    }
  });

  it("getTheory returns a theory by id", () => {
    const theory = getTheory("game_theory");
    expect(theory).toBeDefined();
    expect(theory!.name).toBe("Game Theory");
    expect(theory!.voice).toContain("strategist");
  });

  it("section builders produce non-empty strings", () => {
    const theory = getTheory("game_theory")!;
    const mood = getMood("suspense")!;
    for (const section of theory.sections) {
      const output = section(MOCK_TREND, mood);
      expect(output).toBeTruthy();
      expect(typeof output).toBe("string");
      expect(output.length).toBeGreaterThan(20);
    }
  });

  it("different theories produce different section counts", () => {
    const gameSections = getTheory("game_theory")!.sections.length;
    const butterflySections = getTheory("butterfly_effect")!.sections.length;
    expect(gameSections).toBeGreaterThan(0);
    expect(butterflySections).toBeGreaterThan(0);
  });

  it("same theory with different moods produces different content", () => {
    const theory = getTheory("game_theory")!;
    const hype = getMood("hype")!;
    const irony = getMood("irony")!;
    const bodyHype = theory.sections.map(s => s(MOCK_TREND, hype)).join("\n");
    const bodyIrony = theory.sections.map(s => s(MOCK_TREND, irony)).join("\n");
    expect(bodyHype).not.toBe(bodyIrony);
  });
});
