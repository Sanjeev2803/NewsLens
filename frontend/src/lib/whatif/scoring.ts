import type { TrendInput, Theory, Mood, ScoreBreakdown } from "./types";
import { THEORY_REGISTRY } from "./theories";
import { MOOD_REGISTRY } from "./moods";

// ── Constants ────────────────────────────────────────────────────────────────

const NEGATIVE_KEYWORDS = [
  "crash", "scandal", "failure", "shutdown", "collapse", "death", "loss",
  "crisis", "fall", "drop", "resign", "fired",
];

const POSITIVE_KEYWORDS = [
  "breakthrough", "launch", "record", "win", "growth", "milestone", "success",
  "achieve", "surge", "boom",
];

// Chemistry bonus pairs: theory_id → mood_id that get +0.15
const CHEMISTRY_MAP: Record<string, string> = {
  streisand_effect: "irony",
  black_swan: "shock",
  game_theory: "suspense",
  creative_destruction: "drama",
  dunning_kruger: "irony",
  butterfly_effect: "awe",
  sunk_cost: "fear",
  bandwagon_effect: "hype",
  machiavelli: "suspense",
  overton_window: "curiosity",
  network_effect: "hype",
  murphys_law: "fear",
};

// Traffic magnitude range for normalization (0–1)
const TRAFFIC_MAX = 100_000;

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Parse a traffic string like "5000+" or "2,000" or "10K+" into a number.
 */
function parseTraffic(traffic: string): number {
  const clean = traffic.replace(/,/g, "").replace(/\+/g, "").trim().toUpperCase();
  if (clean.endsWith("K")) return parseFloat(clean) * 1_000;
  if (clean.endsWith("M")) return parseFloat(clean) * 1_000_000;
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

/**
 * Normalize a raw traffic number to a 0–1 score using log scale to avoid
 * extreme compression. Uses log(n+1)/log(TRAFFIC_MAX+1) so the scale feels
 * proportional rather than flat.
 */
function normalizeTraffic(raw: number): number {
  if (raw <= 0) return 0;
  const normalized = Math.log(raw + 1) / Math.log(TRAFFIC_MAX + 1);
  return Math.min(1, normalized);
}

// ── Stage 2: scoreTheory ─────────────────────────────────────────────────────

export interface TheoryScore {
  theory: Theory;
  score: number;
  affinityHit: number;
  keywordHits: string[];
}

/**
 * Score all theories against the trend and category, returning them sorted
 * by descending total score. Deterministic — no randomness.
 */
export function scoreTheory(trend: TrendInput, category: string): TheoryScore[] {
  const trendText = `${trend.title} ${trend.relatedQueries.join(" ")}`.toLowerCase();
  const rawTraffic = parseTraffic(trend.traffic);
  const signalScore = normalizeTraffic(rawTraffic); // weight 0.25

  const results: TheoryScore[] = [];

  for (const theory of THEORY_REGISTRY.values()) {
    const affinityHit = theory.affinities[category] ?? 0; // weight 0.4

    const keywordHits = theory.keywords.filter((kw) =>
      trendText.includes(kw.toLowerCase())
    );
    const keywordScore =
      theory.keywords.length > 0
        ? keywordHits.length / theory.keywords.length
        : 0; // weight 0.35

    const totalScore =
      affinityHit * 0.4 + keywordScore * 0.35 + signalScore * 0.25;

    results.push({ theory, score: totalScore, affinityHit, keywordHits });
  }

  // Sort descending by score; tie-break on theory id for determinism
  results.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) > 1e-9) return diff;
    return a.theory.id.localeCompare(b.theory.id);
  });

  return results;
}

// ── Stage 3: matchMood ───────────────────────────────────────────────────────

export interface MoodScore {
  mood: Mood;
  score: number;
}

/**
 * Given a trend and its top theory, pick the best mood.
 * Scoring factors:
 *   A. Sentiment signal from trend text
 *   B. Velocity signal from traffic magnitude
 *   C. Chemistry bonus if (theory, mood) is a known great pairing
 */
export function matchMood(
  trend: TrendInput,
  theory: Theory,
  excludeMoods?: Set<string>
): MoodScore {
  const trendText = `${trend.title} ${trend.relatedQueries.join(" ")}`.toLowerCase();
  const rawTraffic = parseTraffic(trend.traffic);

  const negCount = NEGATIVE_KEYWORDS.filter((kw) => trendText.includes(kw)).length;
  const posCount = POSITIVE_KEYWORDS.filter((kw) => trendText.includes(kw)).length;

  // Determine sentiment direction: positive > 0, negative < 0, neutral = 0
  const sentimentDirection = posCount - negCount; // positive, neutral, or negative

  const results: MoodScore[] = [];

  for (const mood of MOOD_REGISTRY.values()) {
    if (excludeMoods?.has(mood.id)) continue;

    // A. Sentiment score (0–1): how well does the mood match the sentiment?
    let sentimentScore = 0;
    const isNegativeMood = ["shock", "fear", "anger", "drama"].includes(mood.id);
    const isPositiveMood = ["hype", "hope", "awe", "curiosity"].includes(mood.id);
    const isNeutralMood = ["suspense", "irony", "nostalgia", "vindication"].includes(mood.id);

    if (sentimentDirection < 0 && isNegativeMood) {
      sentimentScore = 0.8 + Math.min(0.2, Math.abs(sentimentDirection) * 0.1);
    } else if (sentimentDirection > 0 && isPositiveMood) {
      sentimentScore = 0.8 + Math.min(0.2, sentimentDirection * 0.1);
    } else if (sentimentDirection === 0 && isNeutralMood) {
      sentimentScore = 0.7;
    } else if (sentimentDirection < 0 && isNeutralMood) {
      sentimentScore = 0.3;
    } else if (sentimentDirection > 0 && isNeutralMood) {
      sentimentScore = 0.35;
    } else {
      sentimentScore = 0.1;
    }

    // B. Velocity score (0–1): traffic magnitude → mood energy preference
    let velocityScore = 0;
    const isHighEnergyMood = ["shock", "hype", "drama"].includes(mood.id);
    const isLowEnergyMood = ["suspense", "curiosity"].includes(mood.id);

    if (rawTraffic > 5_000 && isHighEnergyMood) {
      velocityScore = 0.8;
    } else if (rawTraffic < 1_000 && isLowEnergyMood) {
      velocityScore = 0.8;
    } else if (rawTraffic >= 1_000 && rawTraffic <= 5_000) {
      // Medium traffic — mild preference boost for curiosity/suspense
      if (isLowEnergyMood) velocityScore = 0.5;
      else velocityScore = 0.4;
    } else {
      velocityScore = 0.3;
    }

    // C. Chemistry bonus
    const chemistryBonus =
      CHEMISTRY_MAP[theory.id] === mood.id ? 0.15 : 0;

    const totalScore = sentimentScore * 0.5 + velocityScore * 0.35 + chemistryBonus;

    results.push({ mood, score: totalScore });
  }

  // Sort descending; tie-break on mood id for determinism
  results.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) > 1e-9) return diff;
    return a.mood.id.localeCompare(b.mood.id);
  });

  return results[0];
}

// ── Full pipeline: scoreTrend ─────────────────────────────────────────────────

export interface TrendScore {
  theory: Theory;
  mood: Mood;
  scoreBreakdown: ScoreBreakdown;
}

/**
 * Full 3-stage pipeline:
 *   Stage 1: Parse trend input (inline)
 *   Stage 2: scoreTheory → pick top theory
 *   Stage 3: matchMood → pick best mood for that theory
 * Returns deterministic TrendScore.
 */
export function scoreTrend(trend: TrendInput, category: string): TrendScore {
  // Stage 2
  const theoryRanking = scoreTheory(trend, category);
  const topTheoryResult = theoryRanking[0];

  // Stage 3
  const moodResult = matchMood(trend, topTheoryResult.theory);

  const scoreBreakdown: ScoreBreakdown = {
    theoryScore: topTheoryResult.score,
    moodScore: moodResult.score,
    affinityHit: topTheoryResult.affinityHit,
    keywordHits: topTheoryResult.keywordHits,
  };

  return {
    theory: topTheoryResult.theory,
    mood: moodResult.mood,
    scoreBreakdown,
  };
}
