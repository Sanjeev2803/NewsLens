-- NewsLens What-If Dimension — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Profiles (public user data, linked to Supabase auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Scenarios (the core What If entity)
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_trend TEXT,
  source_trend_url TEXT,
  category TEXT DEFAULT 'general',
  is_ai_generated BOOLEAN DEFAULT false,
  forked_from UUID REFERENCES public.scenarios(id),
  vote_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  country TEXT DEFAULT 'in',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read scenarios" ON public.scenarios FOR SELECT USING (true);
CREATE POLICY "Auth users can create scenarios" ON public.scenarios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR is_ai_generated = true);
CREATE POLICY "Authors can update own scenarios" ON public.scenarios FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "AI scenarios can be inserted without auth" ON public.scenarios FOR INSERT WITH CHECK (is_ai_generated = true);

CREATE INDEX idx_scenarios_created ON public.scenarios(created_at DESC);
CREATE INDEX idx_scenarios_category ON public.scenarios(category);
CREATE INDEX idx_scenarios_country ON public.scenarios(country);
CREATE INDEX idx_scenarios_status ON public.scenarios(status);

-- Outcomes (poll options for each scenario)
CREATE TABLE public.outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read outcomes" ON public.outcomes FOR SELECT USING (true);
CREATE POLICY "Outcomes follow scenario insert" ON public.outcomes FOR INSERT WITH CHECK (true);

CREATE INDEX idx_outcomes_scenario ON public.outcomes(scenario_id);

-- Votes (one per user per scenario)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  outcome_id UUID REFERENCES public.outcomes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, scenario_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change own vote" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vote" ON public.votes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_votes_scenario ON public.votes(scenario_id);

-- Timeline nodes (branching chain of events)
CREATE TABLE public.timeline_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.timeline_nodes(id),
  label TEXT NOT NULL,
  description TEXT,
  probability INT DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.timeline_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read timeline" ON public.timeline_nodes FOR SELECT USING (true);
CREATE POLICY "Timeline follows scenario insert" ON public.timeline_nodes FOR INSERT WITH CHECK (true);

CREATE INDEX idx_timeline_scenario ON public.timeline_nodes(scenario_id);
CREATE INDEX idx_timeline_parent ON public.timeline_nodes(parent_id);

-- Impact ratings (per user per scenario, 4 dimensions)
CREATE TABLE public.impact_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  economy INT DEFAULT 0 CHECK (economy BETWEEN 0 AND 10),
  politics INT DEFAULT 0 CHECK (politics BETWEEN 0 AND 10),
  society INT DEFAULT 0 CHECK (society BETWEEN 0 AND 10),
  tech INT DEFAULT 0 CHECK (tech BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, scenario_id)
);

ALTER TABLE public.impact_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read impacts" ON public.impact_ratings FOR SELECT USING (true);
CREATE POLICY "Auth users can rate" ON public.impact_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON public.impact_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_impacts_scenario ON public.impact_ratings(scenario_id);

-- Evidence links (real articles attached to scenarios)
CREATE TABLE public.evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  source_name TEXT,
  image_url TEXT,
  relevance_note TEXT,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.evidence_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read evidence" ON public.evidence_links FOR SELECT USING (true);
CREATE POLICY "Auth users can add evidence" ON public.evidence_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own evidence" ON public.evidence_links FOR DELETE USING (auth.uid() = added_by);

CREATE INDEX idx_evidence_scenario ON public.evidence_links(scenario_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
