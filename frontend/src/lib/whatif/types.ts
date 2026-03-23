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
