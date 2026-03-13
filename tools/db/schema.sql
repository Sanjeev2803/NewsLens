-- NewsLens Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('rss', 'reddit', 'gnews', 'gdelt', 'mastodon', 'api')),
    url TEXT,
    bias_rating TEXT CHECK (bias_rating IN ('far_left', 'left', 'center_left', 'center', 'center_right', 'right', 'far_right', NULL)),
    reliability_score FLOAT CHECK (reliability_score BETWEEN 0 AND 1),
    config JSONB DEFAULT '{}',
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    content TEXT,
    summary TEXT,
    image_url TEXT,
    author TEXT,
    published_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    sentiment_score FLOAT CHECK (sentiment_score BETWEEN -1 AND 1),
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral', 'mixed')),
    bias_score FLOAT CHECK (bias_score BETWEEN -1 AND 1),
    reading_time INTEGER, -- seconds
    verification_level INTEGER DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 4),
    source_count INTEGER DEFAULT 1,
    topics TEXT[] DEFAULT '{}',
    entities JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    article_count INTEGER DEFAULT 0,
    trending_score FLOAT DEFAULT 0,
    velocity FLOAT DEFAULT 0,
    power_level FLOAT DEFAULT 0,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE article_topics (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    relevance_score FLOAT DEFAULT 1.0,
    PRIMARY KEY (article_id, topic_id)
);

-- ============================================
-- VERIFICATION TABLES
-- ============================================

CREATE TABLE fact_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    verdict TEXT CHECK (verdict IN ('true', 'false', 'mostly_true', 'mostly_false', 'mixed', 'unverified')),
    source_url TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE source_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    confirming_source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    confirming_url TEXT,
    similarity_score FLOAT,
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER & GAMIFICATION TABLES
-- ============================================

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    ninja_rank TEXT DEFAULT 'Academy Student',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_xp (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_rank TEXT DEFAULT 'Academy Student',
    streak_days INTEGER DEFAULT 0,
    streak_last_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE user_reading_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER DEFAULT 0
);

CREATE TABLE quiz_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_date DATE NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER DEFAULT 5,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATOR SPACE TABLES
-- ============================================

CREATE TABLE creator_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES creator_posts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    reactions INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    UNIQUE (post_id, date)
);

-- ============================================
-- WHAT IFS TABLES
-- ============================================

CREATE TABLE what_ifs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    scenario TEXT NOT NULL,
    ai_analysis TEXT,
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
    source_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    votes_agree INTEGER DEFAULT 0,
    votes_disagree INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTS
-- ============================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    html_content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Full-text search
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);
CREATE INDEX idx_articles_topics ON articles USING GIN (topics);

-- Lookups
CREATE INDEX idx_articles_published ON articles (published_at DESC);
CREATE INDEX idx_articles_source ON articles (source_id);
CREATE INDEX idx_articles_sentiment ON articles (sentiment_score);
CREATE INDEX idx_articles_verification ON articles (verification_level);
CREATE INDEX idx_topics_trending ON topics (trending_score DESC);
CREATE INDEX idx_topics_power ON topics (power_level DESC);
CREATE INDEX idx_user_xp_rank ON user_xp (total_xp DESC);
CREATE INDEX idx_reading_log_user ON user_reading_log (user_id, read_at DESC);
CREATE INDEX idx_creator_posts_status ON creator_posts (status, published_at DESC);

-- Trigram for fuzzy search
CREATE INDEX idx_articles_title_trgm ON articles USING GIN (title gin_trgm_ops);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update search_vector on article insert/update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.summary, '') || ' ' ||
        COALESCE(NEW.content, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_search_vector_trigger
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- Auto-update topic article_count
CREATE OR REPLACE FUNCTION update_topic_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE topics SET article_count = article_count + 1, updated_at = NOW()
        WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE topics SET article_count = article_count - 1, updated_at = NOW()
        WHERE id = OLD.topic_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_topics_count_trigger
    AFTER INSERT OR DELETE ON article_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_count();

-- Reading time estimation (avg 200 wpm)
CREATE OR REPLACE FUNCTION estimate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS NOT NULL AND NEW.reading_time IS NULL THEN
        NEW.reading_time := GREATEST(
            60,
            (array_length(string_to_array(NEW.content, ' '), 1) * 60 / 200)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_reading_time_trigger
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION estimate_reading_time();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for articles
CREATE POLICY "Articles are publicly readable"
    ON articles FOR SELECT USING (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON user_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Users can read their own XP
CREATE POLICY "Users can read own xp"
    ON user_xp FOR SELECT USING (auth.uid() = user_id);

-- Public leaderboard (read all XP)
CREATE POLICY "XP leaderboard is public"
    ON user_xp FOR SELECT USING (true);

-- Users can read their own achievements
CREATE POLICY "Users can read own achievements"
    ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own reading log
CREATE POLICY "Users can read own reading log"
    ON user_reading_log FOR SELECT USING (auth.uid() = user_id);

-- Creator posts: public read for published, owner read for all
CREATE POLICY "Published posts are public"
    ON creator_posts FOR SELECT USING (status = 'published');

CREATE POLICY "Creators can manage own posts"
    ON creator_posts FOR ALL USING (auth.uid() = creator_id);
