-- Engagement tables: anonymous voting + comments
-- Run in Supabase SQL Editor after supabase-schema.sql

-- Anonymous votes — track by IP hash, no auth required
CREATE TABLE IF NOT EXISTS public.anonymous_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  outcome_id UUID REFERENCES public.outcomes(id) ON DELETE CASCADE NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scenario_id, ip_hash)
);

ALTER TABLE public.anonymous_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read anonymous_votes" ON public.anonymous_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert anonymous_votes" ON public.anonymous_votes FOR INSERT WITH CHECK (true);

CREATE INDEX idx_anon_votes_scenario ON public.anonymous_votes(scenario_id);
CREATE INDEX idx_anon_votes_ip ON public.anonymous_votes(ip_hash);

-- Comments — anonymous, threaded
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON public.comments FOR INSERT WITH CHECK (true);

CREATE INDEX idx_comments_scenario ON public.comments(scenario_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);
