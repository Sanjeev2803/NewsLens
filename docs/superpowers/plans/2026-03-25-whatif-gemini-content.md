# What-If Gemini Content Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Replace template articles with Gemini 2.5 Flash AI-generated content that reads like a smart friend explaining how trending news affects YOUR life.

**Architecture:** New `gemini.ts` module builds prompts from theory+mood+trend, calls Gemini API, falls back to templates on failure. `generator.ts` becomes async.

**Tech Stack:** TypeScript, Gemini 2.5 Flash API, Vitest

**Spec:** `docs/superpowers/specs/2026-03-25-whatif-gemini-content-design.md`

---

### Task 1: Add sectionNames to Theory interface and all 20 theories

**Files:**
- Modify: `frontend/src/lib/whatif/types.ts`
- Modify: `frontend/src/lib/whatif/theories.ts`
- Test: `frontend/src/__tests__/whatif-theories.test.ts`

- [ ] **Step 1: Add `sectionNames: string[]` to Theory interface in types.ts**

- [ ] **Step 2: Add sectionNames to all 20 theories in theories.ts**

Each theory already has named section builder functions. Extract those names as strings:
- game_theory: ["The Opening Move", "The Board", "The Hidden Play", "The Forced Hand", "The Endgame"]
- butterfly_effect: ["The Small Thing", "The Chain", "The Full Picture"]
- dunning_kruger: ["The Popular Take", "Why It Feels Right", "The Data", "The Expert Reality"]
- streisand_effect: ["The Original", "The Suppression", "The Explosion", "The Irony"]
- pareto_principle: ["The Noise", "The Funnel", "The Lever"]
- (continue for all 20 — derive from the existing section builder function names)

- [ ] **Step 3: Add test assertion that every theory has sectionNames matching sections.length**

```typescript
it("each theory has sectionNames matching sections count", () => {
  for (const theory of THEORY_REGISTRY.values()) {
    expect(theory.sectionNames.length).toBe(theory.sections.length);
    theory.sectionNames.forEach(name => expect(name.length).toBeGreaterThan(0));
  }
});
```

- [ ] **Step 4: Run tests, commit**

Run: `cd frontend && npx vitest run src/__tests__/whatif-theories.test.ts`

---

### Task 2: Build gemini.ts — prompt builder + API client

**Files:**
- Create: `frontend/src/lib/whatif/gemini.ts`
- Test: `frontend/src/__tests__/whatif-gemini.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect, vi } from "vitest";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/whatif/gemini";
import { getTheory } from "@/lib/whatif/theories";
import { getMood } from "@/lib/whatif/moods";
import type { TrendInput } from "@/lib/whatif/types";

const TREND: TrendInput = {
  title: "RCB IPL auction strategy",
  traffic: "5000+",
  relatedQueries: ["IPL 2026 auction", "RCB retention list", "virat kohli"],
  url: "https://trends.google.com/trending/rss?geo=IN",
};

describe("gemini prompt builder", () => {
  it("buildSystemPrompt includes theory voice and mood", () => {
    const theory = getTheory("game_theory")!;
    const mood = getMood("suspense")!;
    const prompt = buildSystemPrompt(theory, mood, "in");
    expect(prompt).toContain("strategist");
    expect(prompt).toContain("Suspense");
    expect(prompt).toContain("pain point");
    expect(prompt).toContain("in"); // country
    expect(prompt).toContain("The Opening Move"); // section name
  });

  it("buildUserPrompt includes trend data", () => {
    const prompt = buildUserPrompt(TREND, "sports", "in");
    expect(prompt).toContain("RCB IPL auction strategy");
    expect(prompt).toContain("5000+");
    expect(prompt).toContain("virat kohli");
    expect(prompt).toContain("sports");
    expect(prompt).toContain("in");
  });

  it("buildSystemPrompt includes base rules about audience", () => {
    const theory = getTheory("butterfly_effect")!;
    const mood = getMood("hype")!;
    const prompt = buildSystemPrompt(theory, mood, "us");
    expect(prompt).toContain("18-24");
    expect(prompt).toContain("No emojis");
    expect(prompt).toContain("pain point");
    expect(prompt).toContain("us");
  });
});
```

- [ ] **Step 2: Implement gemini.ts**

```typescript
import type { Theory, Mood, TrendInput } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TIMEOUT = 15_000;

export function buildSystemPrompt(theory: Theory, mood: Mood, country: string): string {
  const sectionOutline = theory.sectionNames
    .map((name, i) => `${i + 1}. ${name}`)
    .join("\n");

  return `You are a ${theory.voice} writing for NewsLens What-If.
Your analytical lens: ${theory.name} — ${theory.readerRelationship}
Your emotional energy: ${mood.name} — ${mood.feel}
Word temperature: ${mood.wordTemperature.join(", ")}
Sentence rhythm: ${mood.sentenceRhythm}

Structure your article in these sections:
${sectionOutline}

BASE RULES:
- Write as if the READER is living this story. Second person. "You" focused.
- Hit pain points from THEIR daily life — EMI, salary, grocery bill, rent, job market.
- Specific math over vague claims. "That's 847 months of your salary" > "very expensive".
- Humor comes from recognizing your own struggle. Not jokes bolted on top.
- Open with a scroll-stopping hook (Twitter thread energy). Then go deep (podcast analysis).
- Country context: ${country}. Use LOCAL references — currency, culture, daily life.
- Audience: 18-24 year olds. Write like a smart friend, not a news anchor.
- No emojis. No icons. Let the words carry the weight.
- Output in Markdown: ## for section headings, **bold** for emphasis, - for bullet lists.
- Article length: 600-1000 words.`;
}

export function buildUserPrompt(trend: TrendInput, category: string, country: string): string {
  return `Trending topic: "${trend.title}" (search traffic: ${trend.traffic})
Related stories: ${trend.relatedQueries.join(", ")}
Category: ${category}
Country: ${country}

Write the full What-If article. Make predictions. Use real context. Make it personal.`;
}

export async function callGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
          },
        }),
      });

      clearTimeout(timeout);

      if (res.status === 429) return null; // quota — don't retry
      if (!res.ok && attempt === 0) continue; // retry once on 5xx
      if (!res.ok) return null;

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text && text.length > 100 ? text : null;
    } catch {
      if (attempt === 0) continue; // retry once on network error
      return null;
    }
  }
  return null;
}

export async function generateArticleWithGemini(
  theory: Theory,
  mood: Mood,
  trend: TrendInput,
  category: string,
  country: string
): Promise<string | null> {
  const systemPrompt = buildSystemPrompt(theory, mood, country);
  const userPrompt = buildUserPrompt(trend, category, country);
  return callGemini(systemPrompt, userPrompt);
}
```

- [ ] **Step 3: Run tests, commit**

---

### Task 3: Make generator.ts async with Gemini + fallback

**Files:**
- Modify: `frontend/src/lib/whatif/generator.ts`
- Modify: `frontend/src/__tests__/whatif-generator.test.ts`

- [ ] **Step 1: Update generator.ts**

Change `generateScenarios` from sync to async:

```typescript
// Import
import { generateArticleWithGemini } from "./gemini";

// Signature change
export async function generateScenarios(
  trends: TrendInput[], country: string = "in"
): Promise<GeneratedScenario[]> {

  // ... existing scoring logic unchanged ...

  // For each trend, try Gemini first, fall back to templates
  const scenarios: GeneratedScenario[] = [];
  for (const trend of trends) {
    // ... existing scoring per trend ...

    // Compose body — Gemini with template fallback
    let body = await generateArticleWithGemini(theory, mood, trend, category, country);
    if (!body) {
      body = theory.sections.map(fn => fn(trend, mood)).join("\n\n");
    }

    // ... rest unchanged ...
  }
  return scenarios;
}
```

- [ ] **Step 2: Update tests to handle async**

All `generateScenarios()` calls in tests need `await`. Update:
- `whatif-generator.test.ts`
- `whatif-integration.test.ts`

Mock `gemini.ts` in tests to avoid real API calls:
```typescript
vi.mock("@/lib/whatif/gemini", () => ({
  generateArticleWithGemini: vi.fn().mockResolvedValue(null), // forces template fallback in tests
}));
```

- [ ] **Step 3: Run ALL whatif tests, commit**

Run: `cd frontend && npx vitest run src/__tests__/whatif-*.test.ts`

---

### Task 4: Update cron route for async generator

**Files:**
- Modify: `frontend/src/app/api/cron/generate-whatifs/route.ts`

- [ ] **Step 1: Add await to generateScenarios call**

The cron route already calls `generateScenarios` — just add `await` since it's now async:
```typescript
const scenarios = await generateScenarios(newTrends.slice(0, 5), country);
```

- [ ] **Step 2: Verify cron still works**

```bash
curl -s -H "Authorization: Bearer 70af54ce8850dc60c0fd0a91eb238fdeeda477312431f2023fab30b0b23e9a0e" "http://localhost:3000/api/cron/generate-whatifs"
```

- [ ] **Step 3: Run full test suite, commit**

---

### Task 5: Generate fresh content + verify quality

- [ ] **Step 1: Archive old scenarios**

```bash
curl -s -X PATCH "https://foiyivjnhgtgbsdeflki.supabase.co/rest/v1/scenarios?is_ai_generated=eq.true&status=eq.active" \
  -H "apikey: sb_secret_dDFam7RkAaT6TLoYyQhuAA_x_1lf-IK" \
  -H "Authorization: Bearer sb_secret_dDFam7RkAaT6TLoYyQhuAA_x_1lf-IK" \
  -H "Content-Type: application/json" \
  -d '{"status":"archived"}'
```

- [ ] **Step 2: Trigger cron to generate Gemini-powered articles**

- [ ] **Step 3: Read 3 generated articles and verify they are NOT template content**

Check for: second person ("you"), specific numbers, local references, humor, pain points.

- [ ] **Step 4: Commit all changes**
