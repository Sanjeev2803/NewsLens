# What-If v3 — Theories + Moods Engine

**Date:** 2026-03-25
**Status:** Approved design, pending implementation
**Scope:** `frontend/src/lib/whatif/`

## Overview

Upgrade the What-If content engine from template-based articles to a theory-driven, mood-controlled system where each article has a unique voice, structure, and emotional energy — generated from the combination of an analytical theory (the lens) and an emotional mood (the temperature).

The theory IS the copywriting strategy. It doesn't just frame analysis — it generates the hook, structure, escalation pattern, and payoff naturally. The mood adjusts the temperature of every sentence the theory produces.

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Architecture | Modular engine (4 files) | Testable, clean Claude API seam |
| Theory-mood assignment | Algorithmic scoring | Diverse, relevant, testable |
| Mood effect scope | Tone only (word choice, rhythm, hooks) | Reliable for templates. Claude API can do full voice later |
| Theory structure | Each theory owns its shape | No shared template. Game Theory ≠ Butterfly Effect in structure |
| Extensibility | Registry pattern | Add/retire theories and moods by editing one object. No engine changes |
| Claude API | Designed seam, not implemented | Replace step 4 only when API key available |

## Architecture

### File Map

```
lib/whatif/
  types.ts       — updated: +theory, +mood, +scoreBreakdown on GeneratedScenario
  theories.ts    — NEW: 20 theories, THEORY_REGISTRY, narrative engines
  moods.ts       — NEW: 12 moods, MOOD_REGISTRY, tone modifiers
  scoring.ts     — NEW: 3-stage pipeline, category → theory → mood
  generator.ts   — REFACTORED: ~120 lines orchestrator, calls modules
```

### Data Flow

```
Trend input
  → scoring.ts (analyze keywords, pick best theory + mood)
    → theories.ts (get narrative engine: voice, shape, sections)
    → moods.ts (get temperature: word choice, rhythm, energy)
  → generator.ts (compose article using theory shape + mood tone)
  → GeneratedScenario (now includes theory + mood metadata)
```

## Theories

### Definition Interface

```typescript
// A section builder takes trend data + mood and returns one section of markdown
type SectionBuilder = (trend: TrendInput, mood: Mood) => string;

// Theory-native outcome labels
type OutcomeSet = { label: string; description: string }[];

interface Theory {
  id: string;
  name: string;
  group: string;
  voice: string;           // "strategist DM", "storyteller", "roaster with receipts"
  rhythm: string;          // "short punchy", "flowing build", "question-driven"
  readerRelationship: string; // "insider tip", "slow reveal", "challenge"
  sections: SectionBuilder[];  // UNIQUE per theory — variable count, variable style
  outcomes: OutcomeSet[];      // theory-native outcome labels
  affinities: Record<string, number>; // category: score (0-1)
  keywords: string[];          // trigger words for scoring
}
```

### Key Principle: Theory = Narrative Engine

Each theory has its own delivery shape — not Hook/Escalation/Payoff for all. The theory naturally generates its copywriting pattern:

- **Game Theory** — strategist DM. 5-6 short punchy sections. Staccato rhythm. "Here's the thing." Makes you feel like you're getting alpha.
- **Butterfly Effect** — storyteller pulling a thread. 3-4 long flowing sections. "And then..." energy. You're on a journey together.
- **Dunning-Kruger** — roast with receipts. Opens with popular hot take, lets it sit, then dismantles it. Conversational. "Oh, you thought you knew?"
- **Streisand Effect** — live-tweeting a disaster. Timeline format. Accelerating rhythm — each section shorter than the last. Shared disbelief.
- **Pareto Principle** — mentor cutting through noise. Starts wide, narrows ruthlessly. Measured, confident, no wasted words.

### 20 Theories (Starting Set)

**Economics/Strategy:**
1. Game Theory — competitive tension, moves and countermoves
2. Butterfly Effect — chain reaction, one small thing cascading
3. Domino Theory — sequential collapse, numbered inevitability
4. Greater Fool Theory — hot potato, who's holding when music stops
5. Tragedy of the Commons — collective self-destruction, everyone rational but outcome irrational

**Psychology/Behavior:**
6. Dunning-Kruger — confidence gap, loudest voices know the least
7. Bandwagon Effect — momentum illusion, popularity ≠ validity
8. Sunk Cost Fallacy — the trap, too invested to quit
9. Confirmation Bias — the blind spot, you see what you want
10. Herd Mentality — the stampede, crowd moves as one toward the cliff

**Systems/Chaos:**
11. Black Swan — the unmodeled event, retroactive inevitability
12. Chaos Theory — deterministic unpredictability, simulation mindset
13. Murphy's Law — worst-case mapping, catastrophe stacking
14. Pareto Principle — hidden leverage, the 20% that controls 80%
15. Streisand Effect — backfire amplification, dramatic irony

**Power/Society:**
16. Machiavelli's Prince — power decoded, the real move behind the public move
17. Overton Window — normalization, yesterday's extreme is today's mainstream
18. Network Effect — exponential tipping, slow then all at once
19. Creative Destruction — death and rebirth, the old must burn
20. Zero-Sum vs Positive-Sum — the framing question, reframe the game

### Extensibility

- `THEORY_REGISTRY: Map<string, Theory>` — add a theory by defining one object and registering it
- Future theories from research: Anchoring, Framing Effect, Loss Aversion, Hero's Journey, 3-Act Structure
- Retire weak theories by removing from registry. Everything adapts.

## Moods

### Definition Interface

```typescript
interface Mood {
  id: string;
  name: string;
  group: string;
  feel: string;              // one-line emotional description
  wordTemperature: string[]; // word preferences ("exploded" vs "shifted")
  sentenceRhythm: string;   // "short punchy" vs "flowing" vs "fragmented"
  openingEnergy: string;     // how the first line sets the emotional contract
  punctuationStyle: string;  // "periods that hit." vs "questions that linger?"
  readerExitState: string;   // what they feel after reading
}
```

### Key Principle: Mood = Temperature, Not Structure

Mood does NOT change the theory's structure. It changes the temperature of every sentence the theory produces. Same Game Theory article on IPL:

- **Hype:** "RCB just dropped a BOMB. This changes everything."
- **Suspense:** "RCB made one quiet move yesterday. Nobody covered it."
- **Irony:** "RCB's 'rebuilding year' strategy just accidentally cornered three other teams."
- **Fear:** "If you're a CSK fan, stop reading. Seriously."

### 12 Moods (Starting Set)

**High Energy:**
1. Shock — record scratch, "Wait, WHAT?", fragmented sentences, jolted reader
2. Hype — crowd on its feet, punchy building lines, electric reader
3. Drama — season finale energy, cinematic scene-setting, gripped reader
4. Suspense — something's coming, slow reveals, information rationed, leaning forward

**Emotional:**
5. Fear — ground shifting, urgent short sentences, alert reader
6. Hope — light at the end, warm forward-looking, cautiously optimistic
7. Nostalgia — "remember when..." with modern punchline, wistful connection
8. Anger — righteous fire, declarative no-hedging, validated fury

**Intellectual:**
9. Curiosity — "huh, that's interesting...", question-driven, pulled forward
10. Irony — dry smile, understated humor, smart for getting it
11. Awe — stepping back seeing scale, expansive zooming out, perspective shift
12. Vindication — "called it", confident past references, deepened trust

### Extensibility

- `MOOD_REGISTRY: Map<string, Mood>` — same pattern as theories
- Future moods: Defiance, Melancholy, Urgency, Playful, Reverence

## Scoring Algorithm

### 3-Stage Pipeline

**Stage 1: Category Detection** (existing, unchanged)
- Trend keywords + related queries → matched against category keyword banks + regional keywords
- Output: `category: "sports"`

**Stage 2: Theory Scoring** (new)
- For each theory, compute fit score:
  - A. Category affinity — theory's pre-defined score for this category (0-1)
  - B. Keyword resonance — theory trigger keywords found in trend text
  - C. Trend signal analysis — traffic volume, conflict presence, entity count
- Score = `(affinity * 0.4) + (keywordHits * 0.35) + (signalFit * 0.25)`
- Output: Top 3 theories ranked

**Stage 3: Mood Matching** (new)
- Given winning theory + trend, pick the mood that maximizes impact:
  - A. Trend sentiment — negative → Fear/Anger/Shock. Positive → Hype/Hope/Awe.
  - B. Traffic velocity — fast-exploding → Shock/Hype. Slow-burn → Suspense/Curiosity.
  - C. Theory-mood chemistry — natural pairings get a bonus. Initial chemistry map (bonus +0.15):
    - Streisand + Irony, Black Swan + Shock, Game Theory + Suspense
    - Creative Destruction + Drama, Dunning-Kruger + Irony, Butterfly Effect + Awe
    - Sunk Cost + Fear, Bandwagon + Hype, Machiavelli + Suspense
    - Overton Window + Curiosity, Network Effect + Hype, Murphy's Law + Fear
    - (Tune bonuses and add pairings over time based on what generates best content)
  - D. Sentiment detection — keyword-based, same approach as category detection. Negative keywords: "crash", "scandal", "failure", "shutdown", "collapse", "death", "loss", "crisis". Positive keywords: "breakthrough", "launch", "record", "win", "growth", "milestone". No external sentiment library needed.
- Output: Single best mood

### Diversity Guarantee

When generating multiple scenarios in a batch, track used theories and moods. After picking the top scorer, exclude it from the pool for the next trend. Forces variety across a feed page. Fallback to #2 from ranked list.

### Properties

- **Deterministic** — same trend input → same theory-mood combo (seeded by trend title hash). Cacheable.
- **Fast** — pure math, no API calls. <1ms per trend.
- **Testable** — given these keywords and this traffic, assert this theory-mood combo.
- **Tunable** — weights (0.4/0.35/0.25) and chemistry bonuses are editable constants.

## Generator Refactor

### Current (v2) → New (v3)

```
v2 (467 lines, everything inline):
1. detectCategory(trend)
2. pick(CROSSOVERS, seed)
3. pick(FUSION_TITLES[category], seed)
4. switch(contentType) → hardcoded body
5. pick(OUTCOME_SETS[category], seed)

v3 (~120 lines, orchestrator):
1. detectCategory(trend)              // stays
2. scoreTheory(trend, category)       // NEW → theory
3. matchMood(trend, theory)           // NEW → mood
4. theory.sections(trend, mood)       // theory-owned shape + mood temperature
5. generateOutcomes(theory, mood)     // theory-native outcomes
```

### Theory-Native Outcomes

Outcomes emerge from the theory's own language, not generic movie tropes:

- **Game Theory:** The Checkmate, The Nash Equilibrium, The Bluff That Worked, Mutual Destruction
- **Butterfly Effect:** The Full Cascade, The Firebreak, The Bigger Butterfly, The Slow Burn
- **Dunning-Kruger:** The Experts Were Right, The Uncle Was Right, Everyone Was Wrong, The Nuance Nobody Wanted
- **Streisand Effect:** The Full Streisand, The Quiet Delete, The Pivot, The Lawyers Win

## Type Changes

```typescript
// Added to GeneratedScenario:
theory: {
  id: string;    // "game_theory"
  name: string;  // "Game Theory"
  voice: string; // "strategist DM"
};
mood: {
  id: string;    // "suspense"
  name: string;  // "Suspense"
  group: string; // "high_energy"
};
scoreBreakdown: {
  theoryScore: number;
  moodScore: number;
  affinityHit: number;
  keywordHits: string[];
};
```

## Claude API Seam (Future)

When ready, replace step 4 only:

```typescript
// Current (templates):
body = theory.sections.map(fn => fn(trend, mood)).join("\n\n");

// Future (Claude API):
body = await claude.generate({
  system: buildSystemPrompt(theory, mood),
  // "You are a {theory.voice}. Write in {mood.name} tone.
  //  Follow this structure: {theory.sections.map(s => s.name)}
  //  Use these word patterns: {mood.wordBank}"
  user: buildTrendContext(trend, related),
});
```

Theory voice + mood temperature become the system prompt. Scoring stays the same. Types stay the same. Only the body composition changes.

## What's NOT in Scope

- Claude API implementation (future, needs API key)
- X/Twitter as source (separate feature)
- UI changes to display theory/mood badges (follow-up task)
- Regional/cultural personalization of emotional hooks (future refinement)
