-- Migration: Add body + content_type to scenarios
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'article';
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS read_time INT DEFAULT 2;

-- Delete existing AI scenarios so we can regenerate with full content
DELETE FROM public.scenarios WHERE is_ai_generated = true;
