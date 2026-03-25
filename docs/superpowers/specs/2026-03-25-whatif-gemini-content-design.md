# What-If Gemini Content Generation

**Date:** 2026-03-25
**Status:** Approved
**Scope:** `frontend/src/lib/whatif/`

## Overview

Replace template-based What-If articles with Gemini 2.5 Flash AI-generated expert content. The v3 theory/mood/scoring engine becomes the brain that constructs the prompt. Gemini becomes the writer. Articles must feel like a smart friend talking to YOU about news that affects YOUR life.

## Target Audience

18-24 year olds. The content must:
- Use second person ("you") — reader is the protagonist
- Hit pain points — EMI, salary, grocery bills, job market, rent
- Use specific math — "847 months of your salary" not "very expensive"
- Humor from struggle recognition — not bolted-on jokes
- Open with Twitter energy (stop scrolling), deliver podcast depth (substance)
- Country-adaptive references — India gets LPA/EMI, US gets student loans, UK gets council tax
- No emojis. No fire/ice icons. Words do the work.

## Architecture

```
Trend → scoring.ts (pick theory + mood) → gemini.ts (build prompt, call API) → article
                                            ↓ fallback if API fails
                                        generator.ts (template sections)
```

### Prompt Structure (one call per article)

**System prompt** (assembled from theory + mood + base voice):
```
You are a {theory.voice} writing for NewsLens What-If.
Your analytical lens: {theory.name} — {theory.readerRelationship}
Your emotional energy: {mood.name} — {mood.feel}
Word temperature: {mood.wordTemperature.join(", ")}
Sentence rhythm: {mood.sentenceRhythm}

Structure your article in these sections:
{theory.sections.map((_, i) => sectionNames[i]).join("\n")}

BASE RULES:
- Write as if the READER is living this story. Second person. "You" focused.
- Hit pain points from THEIR daily life — EMI, salary, grocery bill, rent, job market.
- Specific math over vague claims. "That's 847 months of your salary" > "very expensive".
- Humor comes from recognizing your own struggle. Not jokes bolted on top.
- Open with a scroll-stopping hook (Twitter thread energy). Then go deep (podcast analysis).
- Country context: {country}. Use LOCAL references — currency, culture, daily life.
- Audience: 18-24 year olds. Write like a smart friend, not a news anchor.
- No emojis. No 🔥 or 💡. Let the words carry the weight.
- Output in Markdown: ## for section headings, **bold** for emphasis, - for bullet lists.
- Article length: 600-1000 words. Not longer.
```

**User prompt** (trend data):
```
Trending topic: "{trend.title}" (search traffic: {trend.traffic})
Related stories: {trend.relatedQueries.join(", ")}
Category: {category}
Country: {country}

Write the full What-If article. Make predictions. Use real context. Make it personal.
```

## File Map

```
lib/whatif/
  gemini.ts      — NEW: Gemini API client, prompt builder, retry, response parsing
  generator.ts   — MOD: compose step calls gemini.ts, falls back to templates
  theories.ts    — UNCHANGED (section names extracted for prompt structure)
  moods.ts       — UNCHANGED (mood data feeds prompt)
  scoring.ts     — UNCHANGED (picks theory + mood)
  types.ts       — UNCHANGED
```

## gemini.ts Design

```typescript
// Prompt builder
function buildSystemPrompt(theory: Theory, mood: Mood, country: string): string
function buildUserPrompt(trend: TrendInput, category: string, country: string): string

// API caller with retry
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string | null>
  - Uses gemini-2.5-flash model
  - Timeout: 15 seconds
  - Retry: 1 retry on 5xx, no retry on 429
  - Returns markdown string or null on failure

// Main export
export async function generateArticleWithGemini(
  theory: Theory,
  mood: Mood,
  trend: TrendInput,
  category: string,
  country: string
): Promise<string | null>
  - Builds prompts, calls API, validates response
  - Returns article body as markdown or null
```

## Generator Changes

```typescript
// Current (sync, templates):
const body = theory.sections.map(fn => fn(trend, mood)).join("\n\n");

// New (async, Gemini with fallback):
let body = await generateArticleWithGemini(theory, mood, trend, category, country);
if (!body) {
  // Fallback to templates — never return empty
  body = theory.sections.map(fn => fn(trend, mood)).join("\n\n");
}
```

`generateScenarios` becomes `async` — the cron already awaits it.

## Caching + Cost Control

- Articles stored in Supabase `body` column during cron — Gemini called ONCE, users read from DB
- Redis cache keyed by `whatif:content:{hashStr(trend.title)}` — prevents re-calling for same trend
- Rate budget: max 5 articles × 9 geos = 45 calls per cron run, with dedup realistic ~20-50/day
- Within Gemini free tier 1,500 RPD limit
- Template fallback: if Gemini returns null, template sections generate instantly

## Theory Section Names

Each theory needs named sections for the prompt outline. These are extracted from the existing section builder function names:

- Game Theory: "The Opening Move", "The Board", "The Hidden Play", "The Forced Hand", "The Endgame"
- Butterfly Effect: "The Small Thing", "The Chain", "The Full Picture"
- Dunning-Kruger: "The Popular Take", "Why It Feels Right", "The Data", "The Expert Reality"
- etc. (each theory already has named sections in theories.ts)

Add `sectionNames: string[]` to the Theory interface.

## What's NOT in Scope

- Gemini image generation (quota blocked, separate task)
- Article UI redesign (separate spec)
- Voting/comments (separate spec)
- Filter fixes (separate spec)
- Dual provider (Groq) — future enhancement when needed
