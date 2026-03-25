import { describe, it, expect } from "vitest";
import { MOOD_REGISTRY, getMood } from "@/lib/whatif/moods";

describe("moods registry", () => {
  it("has exactly 12 moods", () => {
    expect(MOOD_REGISTRY.size).toBe(12);
  });

  it("each mood has required fields", () => {
    for (const [id, mood] of MOOD_REGISTRY) {
      expect(mood.id).toBe(id);
      expect(mood.name).toBeTruthy();
      expect(mood.group).toMatch(/^(high_energy|emotional|intellectual)$/);
      expect(mood.feel).toBeTruthy();
      expect(mood.wordTemperature.length).toBeGreaterThan(0);
      expect(mood.sentenceRhythm).toBeTruthy();
      expect(mood.openingEnergy).toBeTruthy();
      expect(mood.punctuationStyle).toBeTruthy();
      expect(mood.readerExitState).toBeTruthy();
    }
  });

  it("getMood returns a mood by id", () => {
    const mood = getMood("irony");
    expect(mood).toBeDefined();
    expect(mood!.name).toBe("Irony");
    expect(mood!.group).toBe("intellectual");
  });

  it("getMood returns undefined for unknown id", () => {
    expect(getMood("nonexistent")).toBeUndefined();
  });

  it("has 4 high_energy, 4 emotional, 4 intellectual moods", () => {
    const groups = { high_energy: 0, emotional: 0, intellectual: 0 };
    for (const mood of MOOD_REGISTRY.values()) {
      groups[mood.group as keyof typeof groups]++;
    }
    expect(groups.high_energy).toBe(4);
    expect(groups.emotional).toBe(4);
    expect(groups.intellectual).toBe(4);
  });
});
