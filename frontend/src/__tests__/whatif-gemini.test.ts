import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/whatif/gemini";
import type { Theory, Mood, TrendInput } from "@/lib/whatif/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_THEORY: Theory & { sectionNames: string[] } = {
  id: "game_theory",
  name: "Game Theory",
  group: "economics_strategy",
  voice: "strategist DM — insider intel, staccato punches, alpha energy",
  rhythm: "short punchy lines, then one long landing line",
  readerRelationship: "insider giving you the edge nobody else has",
  sections: [], // SectionBuilders not needed for prompt tests
  outcomes: [],
  affinities: { economy: 2, politics: 1 },
  keywords: ["strategy", "move", "player"],
  sectionNames: ["The Opening Move", "The Board", "The Hidden Play", "The Forced Hand", "The Endgame"],
};

const MOCK_MOOD: Mood = {
  id: "suspense",
  name: "Suspense",
  group: "high_energy",
  feel: "something's coming",
  wordTemperature: ["quietly", "behind the scenes", "sources say", "developing", "about to"],
  sentenceRhythm: "Slow reveals — information rationed deliberately.",
  openingEnergy: "Opens with a hint or signal, not the full picture",
  punctuationStyle: "Trailing sentences that don't quite finish... Deliberate gaps.",
  readerExitState: "Leaning forward. Checking for updates.",
};

const MOCK_TREND: TrendInput = {
  title: "RCB IPL auction strategy",
  traffic: "5000+",
  relatedQueries: ["IPL 2026 auction", "RCB retention list", "virat kohli"],
  url: "https://trends.google.com/trending/rss?geo=IN",
};

// ── buildSystemPrompt tests ───────────────────────────────────────────────────

describe("buildSystemPrompt", () => {
  it("includes theory name", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("Game Theory");
  });

  it("includes theory voice", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("strategist DM");
  });

  it("includes theory readerRelationship", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("insider giving you the edge");
  });

  it("includes mood name", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("Suspense");
  });

  it("includes mood feel", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("something's coming");
  });

  it("includes mood wordTemperature values", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("quietly");
    expect(prompt).toContain("behind the scenes");
  });

  it("includes mood sentenceRhythm", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("Slow reveals");
  });

  it("includes all sectionNames as headings", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("The Opening Move");
    expect(prompt).toContain("The Board");
    expect(prompt).toContain("The Hidden Play");
    expect(prompt).toContain("The Forced Hand");
    expect(prompt).toContain("The Endgame");
  });

  it("includes country code in prompt", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("IN");
  });

  it("includes India-specific daily life context for country=in", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toContain("INR");
    // Should reference local daily life details
    expect(prompt).toMatch(/EMI|salary|grocery|Dmart|rupee/i);
  });

  it("includes US context for country=us", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "us");
    expect(prompt).toContain("USD");
    expect(prompt).toMatch(/student loan|rent|health insurance/i);
  });

  it("includes base rule: second person / you-focused", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/second person|"You" focused/i);
  });

  it("includes base rule: specific math over vague claims", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/specific math|Specific math/);
  });

  it("includes base rule: scroll-stopping hook", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/scroll-stopping hook|Twitter energy/i);
  });

  it("includes base rule: no emojis", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/[Nn]o emojis/);
  });

  it("includes base rule: markdown output format", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/Markdown output|## for section/i);
  });

  it("includes word count guideline", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/600.?1000 words/);
  });

  it("includes 18-24 audience targeting", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/18.?24/);
  });

  it("includes smart friend framing", () => {
    const prompt = buildSystemPrompt(MOCK_THEORY, MOCK_MOOD, "in");
    expect(prompt).toMatch(/smart friend/i);
  });

  it("falls back gracefully when sectionNames is absent", () => {
    // Theory without sectionNames (old shape — parallel agent hasn't added it yet)
    const { sectionNames: _, ...rest } = MOCK_THEORY;
    const theoryWithoutSectionNames = { ...rest, sectionNames: [] } as Theory;

    const prompt = buildSystemPrompt(theoryWithoutSectionNames, MOCK_MOOD, "in");
    expect(prompt).toContain("narrative arc");
  });
});

// ── buildUserPrompt tests ─────────────────────────────────────────────────────

describe("buildUserPrompt", () => {
  it("includes trend title", () => {
    const prompt = buildUserPrompt(MOCK_TREND, "sports", "in");
    expect(prompt).toContain("RCB IPL auction strategy");
  });

  it("includes traffic data", () => {
    const prompt = buildUserPrompt(MOCK_TREND, "sports", "in");
    expect(prompt).toContain("5000+");
  });

  it("includes all related queries", () => {
    const prompt = buildUserPrompt(MOCK_TREND, "sports", "in");
    expect(prompt).toContain("IPL 2026 auction");
    expect(prompt).toContain("RCB retention list");
    expect(prompt).toContain("virat kohli");
  });

  it("includes category", () => {
    const prompt = buildUserPrompt(MOCK_TREND, "sports", "in");
    expect(prompt).toContain("sports");
  });

  it("includes country code", () => {
    const prompt = buildUserPrompt(MOCK_TREND, "sports", "in");
    expect(prompt).toContain("IN");
  });

  it("asks for bold specific predictions", () => {
    const prompt = buildUserPrompt(MOCK_TREND, "economy", "us");
    expect(prompt).toMatch(/bold|specific|commit/i);
  });

  it("instructs to make it personal to reader in their country", () => {
    const prompt = buildUserPrompt(MOCK_TREND, "economy", "gb");
    expect(prompt).toMatch(/personal|life/i);
    expect(prompt).toContain("GB");
  });

  it("handles trend with no related queries gracefully", () => {
    const trendNoQueries: TrendInput = { ...MOCK_TREND, relatedQueries: [] };
    const prompt = buildUserPrompt(trendNoQueries, "general", "in");
    expect(prompt).toContain("none");
    expect(prompt).toContain("RCB IPL auction strategy");
  });
});
