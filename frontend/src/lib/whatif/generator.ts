/*
  What-If Content Generator v3 — Theory-Driven, Mood-Controlled Orchestrator

  Each article is driven by:
  - A theory (narrative lens, voice, structure, outcomes)
  - A mood (emotional temperature, rhythm, punctuation style)
  - Batch diversity (no two trends get the same theory or mood)

  The generator orchestrates: scoring -> composition -> scenario assembly.
*/

import type { GeneratedScenario, TrendInput, Theory, Mood } from "./types";
import { scoreTheory, matchMood } from "./scoring";
import { generateArticleWithGemini } from "./gemini";

// ── Regional keywords for category detection ──

const REGIONAL_SPORTS: Record<string, string[]> = {
  in: [
    "cricket", "ipl", "wicket", "kohli", "dhoni", "bumrah", "rohit sharma",
    "rcb", "csk", "mi", "srh", "kkr", "dc", "pbks", "gt", "lsg", "rr",
    "bcci", "test match", "odi", "t20", "ranji", "kabaddi", "pro kabaddi",
    "badminton", "pv sindhu", "neeraj chopra", "hockey india",
  ],
  us: [
    "nfl", "nba", "mlb", "nhl", "super bowl", "touchdown", "home run",
    "lebron", "curry", "mahomes", "world series", "stanley cup",
    "march madness", "ncaa", "mls", "draft pick",
  ],
  gb: [
    "premier league", "epl", "arsenal", "chelsea", "liverpool", "man city",
    "man united", "tottenham", "fa cup", "the ashes", "rugby", "wimbledon", "f1",
  ],
  de: ["bundesliga", "bayern", "dortmund", "dfb", "handball", "formula 1"],
  fr: ["ligue 1", "psg", "mbappe", "roland garros", "tour de france"],
  jp: ["npb", "baseball", "j-league", "sumo", "shohei ohtani"],
  au: ["afl", "nrl", "cricket australia", "ashes", "australian open"],
  br: ["brasileirão", "flamengo", "palmeiras", "neymar", "copa libertadores"],
  ca: ["nhl", "hockey", "maple leafs", "cfl", "raptors", "blue jays"],
};

const REGIONAL_POLITICS: Record<string, string[]> = {
  in: ["bjp", "congress", "modi", "rahul gandhi", "lok sabha", "rajya sabha", "rbi"],
  us: ["trump", "biden", "democrat", "republican", "senate", "white house"],
  gb: ["labour", "conservative", "starmer", "parliament", "downing street"],
  de: ["bundestag", "scholz", "spd", "cdu", "afd"],
  fr: ["macron", "assemblée", "le pen"],
  jp: ["diet", "ldp", "kishida"],
  au: ["albanese", "liberal party", "labor"],
  br: ["lula", "bolsonaro", "congresso"],
  ca: ["trudeau", "parliament", "liberal", "conservative"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: ["election", "minister", "parliament", "government", "bill", "law", "policy", "president", "senate", "vote", "diplomat", "sanction", "protest", "opposition", "cabinet", "referendum"],
  economy: ["market", "stock", "dollar", "gdp", "inflation", "trade", "tax", "budget", "recession", "crypto", "bitcoin", "fed", "interest rate", "startup", "ipo", "investment", "unemployment", "tariff", "rupee", "sensex", "nifty", "rbi"],
  tech: ["ai", "artificial intelligence", "chatgpt", "openai", "google", "apple", "meta", "microsoft", "software", "app", "robot", "chip", "semiconductor", "quantum", "spacex", "tesla", "5g", "cybersecurity", "hack", "cloud", "blockchain"],
  sports: ["match", "fifa", "olympics", "player", "team", "goal", "medal", "champion", "league", "world cup", "tennis", "f1", "grand prix"],
  entertainment: ["movie", "bollywood", "hollywood", "actor", "actress", "netflix", "album", "concert", "oscar", "grammy", "series", "disney", "box office", "trailer", "celebrity", "k-pop", "music"],
  society: ["climate", "environment", "education", "health", "hospital", "pandemic", "vaccine", "pollution", "flood", "earthquake", "disaster", "poverty", "migration", "refugee", "culture"],
};

export function detectCategory(trend: TrendInput, country: string = "in"): string {
  const text = `${trend.title} ${trend.relatedQueries.join(" ")}`.toLowerCase();
  let best = "general";
  let bestScore = 0;
  const regionalSports = REGIONAL_SPORTS[country] || [];
  const regionalPolitics = REGIONAL_POLITICS[country] || [];
  const merged: Record<string, string[]> = {
    ...CATEGORY_KEYWORDS,
    sports: [...CATEGORY_KEYWORDS.sports, ...regionalSports],
    politics: [...CATEGORY_KEYWORDS.politics, ...regionalPolitics],
  };
  for (const [cat, kws] of Object.entries(merged)) {
    const score = kws.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

// ── Seeded pseudo-random for deterministic generation ──

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Helper: generate title from theory voice + trend ──

function generateTitle(trend: TrendInput, theory: Theory, mood: Mood): string {
  const seed = hashStr(trend.title);
  const templates: Record<string, ((t: string) => string)[]> = {
    economics_strategy: [
      (t) => `${t}: The move nobody's seeing`,
      (t) => `The hidden play behind ${t}`,
      (t) => `${t} — follow the incentives, find the answer`,
      (t) => `Why ${t} is a bigger deal than you think`,
    ],
    psychology_behavior: [
      (t) => `${t}: What the crowd is missing`,
      (t) => `The psychology behind ${t} — and what comes next`,
      (t) => `${t}: A pattern recognition exercise`,
      (t) => `Why everyone's wrong about ${t}`,
    ],
    systems_chaos: [
      (t) => `It started with ${t} — here's where the chain leads`,
      (t) => `${t}: The cascade nobody mapped`,
      (t) => `Three dominoes from ${t} to everything changing`,
      (t) => `${t} and the system it just broke`,
    ],
    power_society: [
      (t) => `${t}: Who benefits, who pays`,
      (t) => `The power map behind ${t}`,
      (t) => `${t} — a window nobody's looking through`,
      (t) => `What ${t} reveals about who's really in charge`,
    ],
  };

  const group = theory.group;
  const pool = templates[group] || templates.economics_strategy;
  const fn = pool[seed % pool.length];
  return fn(trend.title);
}

// ── Helper: derive content_type from theory group ──

function deriveContentType(theory: Theory): string {
  const map: Record<string, string> = {
    economics_strategy: "analysis",
    psychology_behavior: "case_study",
    systems_chaos: "prediction",
    power_society: "article",
  };
  return map[theory.group] || "article";
}

// ── Helper: generate editorial description ──

function generateDescription(trend: TrendInput, theory: Theory, mood: Mood): string {
  const seed = hashStr(trend.title);
  const related = trend.relatedQueries[0] || trend.title;
  const descriptions: Record<string, string[]> = {
    economics_strategy: [
      `The strategic implications of ${trend.title} run deeper than the headlines suggest.`,
      `Behind ${trend.title} lies a strategic calculation most observers are missing.`,
      `${trend.title} isn't just news — it's a move in a larger game. Here's the board.`,
    ],
    psychology_behavior: [
      `Everyone has a take on ${trend.title}. The data tells a different story.`,
      `The collective reaction to ${trend.title} reveals more than the event itself.`,
      `${trend.title} is a mirror — what you see in it says more about you than the news.`,
    ],
    systems_chaos: [
      `${trend.title} is the visible part. The chain reaction happening underneath is what matters.`,
      `Trace the thread from ${trend.title} far enough and the picture changes completely.`,
      `The system just got a shock. Here's what ${trend.title} triggers next.`,
    ],
    power_society: [
      `${trend.title} shifts the landscape in ways that won't be obvious for weeks.`,
      `Who wins and who loses from ${trend.title}? The answer isn't what you'd expect.`,
      `The real story behind ${trend.title} isn't in the press release.`,
    ],
  };
  const pool = descriptions[theory.group] || descriptions.economics_strategy;
  return pool[seed % pool.length];
}

// ── Main generator ──

export async function generateScenarios(trends: TrendInput[], country: string = "in"): Promise<GeneratedScenario[]> {
  const usedTheories = new Set<string>();
  const usedMoods = new Set<string>();
  const scenarios: GeneratedScenario[] = [];

  for (const trend of trends) {
    const category = detectCategory(trend, country);

    // Stage 2: Score theories for this trend's category, with batch dedup
    const ranked = scoreTheory(trend, category);
    const pick = ranked.find((r) => !usedTheories.has(r.theory.id)) ?? ranked[0];
    usedTheories.add(pick.theory.id);

    const theory = pick.theory;

    // Stage 3: Match mood with batch dedup
    const moodResult = matchMood(trend, theory, usedMoods);
    usedMoods.add(moodResult.mood.id);

    const mood = moodResult.mood;

    // Compose body via Gemini with template fallback (sequential — respect rate limits)
    let body = await generateArticleWithGemini(theory, mood, trend, category, country);
    if (!body) {
      // Fallback to templates if Gemini fails
      body = theory.sections.map((fn) => fn(trend, mood)).join("\n\n");
    }

    // Pick outcome set deterministically
    const seed = hashStr(trend.title);
    const outcomes = theory.outcomes[seed % theory.outcomes.length];

    // Generate title and content type
    const title = generateTitle(trend, theory, mood);
    const contentType = deriveContentType(theory);
    const readTime = Math.max(2, Math.ceil(body.length / 1000));

    const scoreBreakdown = {
      theoryScore: pick.score,
      moodScore: moodResult.score,
      affinityHit: pick.affinityHit,
      keywordHits: pick.keywordHits,
    };

    scenarios.push({
      title,
      description: generateDescription(trend, theory, mood),
      body,
      content_type: contentType,
      read_time: readTime,
      source_trend: trend.title,
      source_trend_url: trend.url,
      category,
      is_ai_generated: true,
      country,
      outcomes,
      theory: { id: theory.id, name: theory.name, voice: theory.voice },
      mood: { id: mood.id, name: mood.name, group: mood.group },
      scoreBreakdown,
    });
  }

  return scenarios;
}
