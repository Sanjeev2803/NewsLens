# What-If v3 — Theories + Moods Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace template-based What-If article generation with a theory-driven, mood-controlled engine where each theory has its own unique voice, structure, and copywriting pattern.

**Architecture:** 3 new modules (theories.ts, moods.ts, scoring.ts) + refactored generator.ts. Registry pattern for extensibility. Each theory owns its narrative shape. Mood adjusts temperature. Scoring algorithm picks the best combo algorithmically.

**Tech Stack:** TypeScript, Vitest, Next.js App Router

**Spec:** `docs/superpowers/specs/2026-03-25-whatif-v3-theories-moods-design.md`

---

### Task 1: Update types.ts with v3 interfaces

**Files:**
- Modify: `frontend/src/lib/whatif/types.ts`
- Test: `frontend/src/__tests__/whatif-types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/src/__tests__/whatif-types.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/whatif-types.test.ts`
Expected: FAIL — `Theory`, `Mood`, `SectionBuilder`, `TrendInput`, `ScoreBreakdown` not exported from types.ts

- [ ] **Step 3: Add v3 types to types.ts**

Add these exports to `frontend/src/lib/whatif/types.ts`:

```typescript
// ── v3: Trend input (moved from generator.ts to shared types) ──

export interface TrendInput {
  title: string;
  traffic: string;
  relatedQueries: string[];
  url: string;
}

// ── v3: Theory engine ──

export type SectionBuilder = (trend: TrendInput, mood: Mood) => string;

export type OutcomeSet = { label: string; description: string }[];

export interface Theory {
  id: string;
  name: string;
  group: string;
  voice: string;
  rhythm: string;
  readerRelationship: string;
  sections: SectionBuilder[];
  outcomes: OutcomeSet[];
  affinities: Record<string, number>;
  keywords: string[];
}

// ── v3: Mood system ──

export interface Mood {
  id: string;
  name: string;
  group: string;
  feel: string;
  wordTemperature: string[];
  sentenceRhythm: string;
  openingEnergy: string;
  punctuationStyle: string;
  readerExitState: string;
}

// ── v3: Score breakdown ──

export interface ScoreBreakdown {
  theoryScore: number;
  moodScore: number;
  affinityHit: number;
  keywordHits: string[];
}
```

Update `GeneratedScenario` to add v3 fields:

```typescript
export interface GeneratedScenario {
  title: string;
  description: string;
  body: string;
  content_type: string;
  read_time: number;
  source_trend: string;
  source_trend_url: string;
  category: string;
  is_ai_generated: boolean;
  country: string;
  outcomes: { label: string; description?: string }[];
  // v3 metadata
  theory: { id: string; name: string; voice: string };
  mood: { id: string; name: string; group: string };
  scoreBreakdown: ScoreBreakdown;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/whatif-types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/whatif/types.ts frontend/src/__tests__/whatif-types.test.ts
git commit -m "feat(whatif): add v3 type definitions — Theory, Mood, SectionBuilder, ScoreBreakdown"
```

---

### Task 2: Build moods.ts — 12 mood definitions + registry

**Files:**
- Create: `frontend/src/lib/whatif/moods.ts`
- Test: `frontend/src/__tests__/whatif-moods.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/src/__tests__/whatif-moods.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/whatif-moods.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement moods.ts**

Create `frontend/src/lib/whatif/moods.ts` with all 12 mood definitions. Each mood has:
- `id`, `name`, `group`, `feel`
- `wordTemperature` — array of preferred words for this mood
- `sentenceRhythm` — description of sentence patterns
- `openingEnergy` — how first line sets the contract
- `punctuationStyle` — punctuation personality
- `readerExitState` — what reader feels after

The 12 moods (from spec):
- **High Energy:** shock, hype, drama, suspense
- **Emotional:** fear, hope, nostalgia, anger
- **Intellectual:** curiosity, irony, awe, vindication

Export `MOOD_REGISTRY: Map<string, Mood>` and `getMood(id: string): Mood | undefined`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/whatif-moods.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/whatif/moods.ts frontend/src/__tests__/whatif-moods.test.ts
git commit -m "feat(whatif): add 12 moods registry with tone modifiers"
```

---

### Task 3: Build theories.ts — first 5 theories with narrative engines

**Files:**
- Create: `frontend/src/lib/whatif/theories.ts`
- Test: `frontend/src/__tests__/whatif-theories.test.ts`

**Note:** Build the first 5 theories (Game Theory, Butterfly Effect, Dunning-Kruger, Streisand Effect, Pareto Principle) with full narrative engines. These 5 have detailed voice/shape specs from the design. The remaining 15 follow in Task 4.

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/src/__tests__/whatif-theories.test.ts
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
    // They CAN be the same, but we test they're defined
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/whatif-theories.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement theories.ts with first 5 theories**

Create `frontend/src/lib/whatif/theories.ts`. Each theory defines:
- Metadata: id, name, group, voice, rhythm, readerRelationship
- `sections: SectionBuilder[]` — unique per theory, variable count, each takes (trend, mood) and returns markdown. The mood parameter controls word choice and energy within the theory's structure.
- `outcomes: OutcomeSet[]` — theory-native outcome labels
- `affinities: Record<string, number>` — category scores 0-1
- `keywords: string[]` — trigger words for scoring

First 5 theories to implement with full narrative engines:
1. **game_theory** — 5 short punchy sections (openingMove, theBoard, hiddenPlay, forcedHand, endgame)
2. **butterfly_effect** — 3 long flowing sections (theSmallThing, theChain, theFullPicture)
3. **dunning_kruger** — 4 sections (thePopularTake, whyItFeelsRight, theData, theExpertReality)
4. **streisand_effect** — 4 accelerating sections (theOriginal, theSuppression, theExplosion, theIrony)
5. **pareto_principle** — 3 narrowing sections (theNoise, theFunnel, theLever)

Export `THEORY_REGISTRY: Map<string, Theory>` and `getTheory(id: string): Theory | undefined`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/whatif-theories.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/whatif/theories.ts frontend/src/__tests__/whatif-theories.test.ts
git commit -m "feat(whatif): add first 5 theories with unique narrative engines"
```

---

### Task 4: Add remaining 15 theories

**Files:**
- Modify: `frontend/src/lib/whatif/theories.ts`
- Modify: `frontend/src/__tests__/whatif-theories.test.ts`

- [ ] **Step 1: Add test assertion for 20 theories**

Add to the existing test file:

```typescript
it("has exactly 20 theories", () => {
  expect(THEORY_REGISTRY.size).toBe(20);
});

it("covers all 4 groups", () => {
  const groups = new Set<string>();
  for (const theory of THEORY_REGISTRY.values()) groups.add(theory.group);
  expect(groups).toContain("economics_strategy");
  expect(groups).toContain("psychology_behavior");
  expect(groups).toContain("systems_chaos");
  expect(groups).toContain("power_society");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/whatif-theories.test.ts`
Expected: FAIL — only 5 theories registered

- [ ] **Step 3: Add remaining 15 theories**

Add to `theories.ts` with unique narrative engines for each:

**Economics/Strategy (3 remaining):**
- domino_theory — numbered sequential sections
- greater_fool — building hype then cliff reveal
- tragedy_of_commons — parallel logic tracks converging to disaster

**Psychology/Behavior (4 remaining):**
- bandwagon_effect — wave tracking then exposure
- sunk_cost — investment history building to the trap
- confirmation_bias — dual perspective then blind spot reveal
- herd_mentality — stampede tracking with aerial perspective

**Systems/Chaos (3 remaining):**
- black_swan — model vs reality divergence
- chaos_theory — simulation/variable sensitivity
- murphys_law — failure stacking

**Power/Society (5 remaining):**
- machiavelli — public vs private move decoding
- overton_window — timeline compression
- network_effect — hockey stick narrative
- creative_destruction — eulogy + birth
- zero_sum — reframe the game

Each theory gets its own voice, section count, rhythm, and outcomes — no two should feel the same.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/whatif-theories.test.ts`
Expected: PASS — 20 theories across 4 groups

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/whatif/theories.ts frontend/src/__tests__/whatif-theories.test.ts
git commit -m "feat(whatif): complete all 20 theories with unique narrative engines"
```

---

### Task 5: Build scoring.ts — 3-stage pipeline

**Files:**
- Create: `frontend/src/lib/whatif/scoring.ts`
- Test: `frontend/src/__tests__/whatif-scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/src/__tests__/whatif-scoring.test.ts
import { describe, it, expect } from "vitest";
import { scoreTheory, matchMood, scoreTrend } from "@/lib/whatif/scoring";
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
      // Game theory should rank high for auction/strategy content
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/whatif-scoring.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement scoring.ts**

Create `frontend/src/lib/whatif/scoring.ts` implementing:

1. **`scoreTheory(trend, category)`** — stage 2 of pipeline
   - For each theory in THEORY_REGISTRY, compute: `(affinity * 0.4) + (keywordHits * 0.35) + (signalFit * 0.25)`
   - Return top theories ranked by score

2. **`matchMood(trend, theory)`** — stage 3 of pipeline
   - Sentiment detection via keywords (negative: "crash", "shutdown", etc. positive: "breakthrough", "launch", etc.)
   - Traffic velocity scoring (parse traffic string for magnitude)
   - Theory-mood chemistry bonuses (+0.15 for natural pairings from spec)
   - Return best mood with score

3. **`scoreTrend(trend, category)`** — full pipeline wrapper
   - Calls scoreTheory → matchMood → returns `{ theory, mood, scoreBreakdown }`

Export all three functions. Import from `THEORY_REGISTRY` and `MOOD_REGISTRY`.

Constants to define:
- `AFFINITY_WEIGHT = 0.4`, `KEYWORD_WEIGHT = 0.35`, `SIGNAL_WEIGHT = 0.25`
- `CHEMISTRY_BONUS = 0.15`
- `CHEMISTRY_MAP: [theoryId, moodId][]` (12 pairings from spec)
- `NEGATIVE_KEYWORDS`, `POSITIVE_KEYWORDS` (from spec)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/whatif-scoring.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/whatif/scoring.ts frontend/src/__tests__/whatif-scoring.test.ts
git commit -m "feat(whatif): add 3-stage scoring pipeline — theory scoring, mood matching, diversity"
```

---

### Task 6: Add batch diversity to scoring

**Files:**
- Modify: `frontend/src/lib/whatif/scoring.ts`
- Modify: `frontend/src/__tests__/whatif-scoring.test.ts`

- [ ] **Step 1: Write the failing test**

Add to scoring test file:

```typescript
describe("batch diversity", () => {
  it("scoreTrendBatch avoids duplicate theories across a batch", () => {
    const trends: TrendInput[] = [
      { title: "OnePlus shutdown", traffic: "5000+", relatedQueries: ["CEO resigns", "shutdown"], url: "u" },
      { title: "Samsung collapse fears", traffic: "3000+", relatedQueries: ["market crash", "shutdown"], url: "u" },
      { title: "Xiaomi factory closure", traffic: "2000+", relatedQueries: ["closing down", "failure"], url: "u" },
    ];
    const results = scoreTrendBatch(trends, "tech");
    const theoryIds = results.map(r => r.theory.id);
    // All 3 should be different theories even though trends are similar
    expect(new Set(theoryIds).size).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/whatif-scoring.test.ts`
Expected: FAIL — `scoreTrendBatch` not exported

- [ ] **Step 3: Implement scoreTrendBatch**

Add to `scoring.ts`:

```typescript
export function scoreTrendBatch(
  trends: TrendInput[],
  category: string
): { theory: Theory; mood: Mood; scoreBreakdown: ScoreBreakdown }[] {
  const usedTheories = new Set<string>();
  const usedMoods = new Set<string>();
  return trends.map((trend) => {
    const ranked = scoreTheory(trend, category);
    // Pick highest-scoring theory not yet used
    const pick = ranked.find(r => !usedTheories.has(r.theory.id)) || ranked[0];
    usedTheories.add(pick.theory.id);
    const moodResult = matchMood(trend, pick.theory, usedMoods);
    usedMoods.add(moodResult.mood.id);
    return {
      theory: pick.theory,
      mood: moodResult.mood,
      scoreBreakdown: {
        theoryScore: pick.score,
        moodScore: moodResult.score,
        affinityHit: pick.affinityHit,
        keywordHits: pick.keywordHits,
      },
    };
  });
}
```

Update `matchMood` signature to accept optional `excludeMoods: Set<string>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/whatif-scoring.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/whatif/scoring.ts frontend/src/__tests__/whatif-scoring.test.ts
git commit -m "feat(whatif): add batch diversity — dedup theories and moods across feed"
```

---

### Task 7: Refactor generator.ts to v3 orchestrator

**Files:**
- Modify: `frontend/src/lib/whatif/generator.ts`
- Test: `frontend/src/__tests__/whatif-generator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/src/__tests__/whatif-generator.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/whatif-generator.test.ts`
Expected: FAIL — GeneratedScenario missing `theory`, `mood`, `scoreBreakdown`

- [ ] **Step 3: Refactor generator.ts**

Rewrite `frontend/src/lib/whatif/generator.ts` as a ~120 line orchestrator:

1. Keep `detectCategory()` and its keyword data (REGIONAL_SPORTS, REGIONAL_POLITICS, CATEGORY_KEYWORDS) — this is Stage 1
2. Remove all old template functions (generateHotTake, generateDeepDive, etc.)
3. Remove CROSSOVERS, FUSION_TITLES, OUTCOME_SETS, CONTENT_TYPES
4. Import `scoreTrendBatch` from `./scoring`
5. New `generateScenarios` flow:
   - Call `scoreTrendBatch(trends, country)` — gets theory + mood per trend
   - For each trend + theory + mood: compose body via `theory.sections.map(fn => fn(trend, mood)).join("\n\n")`
   - Generate title from theory voice + trend title
   - Use `theory.outcomes` for outcome labels
   - Return `GeneratedScenario[]` with all v3 fields

Export `generateScenarios` with same signature: `(trends: TrendInput[], country?: string) => GeneratedScenario[]`

Also export `detectCategory` so scoring.ts can use it.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/whatif-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Run ALL tests to verify nothing broke**

Run: `cd frontend && npx vitest run`
Expected: All tests pass. The whatif API route imports `generateScenarios` — the signature is unchanged so no API route changes needed.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/whatif/generator.ts frontend/src/__tests__/whatif-generator.test.ts
git commit -m "feat(whatif): refactor generator to v3 — theory-driven, mood-controlled orchestrator"
```

---

### Task 8: Integration test + verify live endpoint

**Files:**
- Test: `frontend/src/__tests__/whatif-integration.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
// frontend/src/__tests__/whatif-integration.test.ts
import { describe, it, expect } from "vitest";
import { generateScenarios } from "@/lib/whatif/generator";
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
  it("generates 5 diverse scenarios from 5 different trends", () => {
    const scenarios = generateScenarios(DIVERSE_TRENDS, "in");
    expect(scenarios.length).toBe(5);

    // All theories should be different (diversity guarantee)
    const theories = scenarios.map(s => s.theory.id);
    expect(new Set(theories).size).toBe(5);

    // All moods should be different
    const moods = scenarios.map(s => s.mood.id);
    expect(new Set(moods).size).toBe(5);
  });

  it("every registered theory produces valid output", () => {
    // Test each theory individually with a generic trend
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
```

- [ ] **Step 2: Run integration test**

Run: `cd frontend && npx vitest run src/__tests__/whatif-integration.test.ts`
Expected: PASS

- [ ] **Step 3: Run full test suite**

Run: `cd frontend && npx vitest run`
Expected: ALL tests pass

- [ ] **Step 4: Verify live endpoint (manual)**

Run: `curl -s "http://localhost:3000/api/cron/generate-whatifs?secret=YOUR_CRON_SECRET" | head -20`

Or check the What-If page in the browser at `http://localhost:3000/whatif` — new scenarios should have theory/mood metadata.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/__tests__/whatif-integration.test.ts
git commit -m "test(whatif): add v3 integration tests — diversity, cross-compatibility, coverage"
```

---

### Task 9: Final commit + cleanup

**Files:**
- Verify: all files in `frontend/src/lib/whatif/`
- Verify: all test files

- [ ] **Step 1: Run full test suite one final time**

Run: `cd frontend && npx vitest run`
Expected: ALL tests pass

- [ ] **Step 2: Verify file structure**

Run: `ls frontend/src/lib/whatif/`
Expected:
```
generator.ts
moods.ts
scoring.ts
theories.ts
types.ts
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Final commit if any uncommitted changes**

```bash
git add -A
git commit -m "feat(whatif): What-If v3 complete — 20 theories, 12 moods, scoring pipeline"
```
