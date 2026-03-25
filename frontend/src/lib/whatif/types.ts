export interface Scenario {
  id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  body: string | null;
  content_type: "article" | "analysis" | "case_study" | "prediction";
  cover_image: string | null;
  read_time: number;
  source_trend: string | null;
  source_trend_url: string | null;
  category: string;
  is_ai_generated: boolean;
  forked_from: string | null;
  vote_count: number;
  status: "active" | "archived" | "resolved";
  country: string;
  created_at: string;
  updated_at: string;
  // Joined data
  outcomes?: Outcome[];
  profile?: Profile | null;
}

export interface Outcome {
  id: string;
  scenario_id: string;
  label: string;
  description: string | null;
  vote_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  scenario_id: string;
  outcome_id: string;
  created_at: string;
}

export interface TimelineNode {
  id: string;
  scenario_id: string;
  parent_id: string | null;
  label: string;
  description: string | null;
  probability: number;
  sort_order: number;
  created_at: string;
}

export interface ImpactRating {
  id: string;
  scenario_id: string;
  user_id: string;
  economy: number;
  politics: number;
  society: number;
  tech: number;
  created_at: string;
}

export interface EvidenceLink {
  id: string;
  scenario_id: string;
  added_by: string | null;
  url: string;
  title: string;
  source_name: string | null;
  image_url: string | null;
  relevance_note: string | null;
  upvotes: number;
  created_at: string;
}

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

export const CONTENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  article: { label: "ARTICLE", color: "#7B2FBE" },
  analysis: { label: "ANALYSIS", color: "#00B4D8" },
  case_study: { label: "CASE STUDY", color: "#FF6B00" },
  prediction: { label: "PREDICTION", color: "#E63946" },
};

export const WHATIF_CATEGORIES = [
  "politics",
  "economy",
  "tech",
  "society",
  "sports",
  "entertainment",
  "general",
] as const;

export type WhatIfCategory = (typeof WHATIF_CATEGORIES)[number];

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
