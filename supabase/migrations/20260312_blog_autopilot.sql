-- ── MockOfsted autopilot blog — migration 20260312 ────────────────────────────
-- Creates the blog_posts table + RLS policies.
-- Cron is registered separately (requires pg_cron enabled in Dashboard first).
-- Edge function: supabase/functions/blog-sync/index.ts

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  source_name   text        NOT NULL,
  source_url    text        NOT NULL,
  published_at  timestamptz NOT NULL,
  summary_md    text        NOT NULL,
  excerpt       text        NOT NULL,
  tags          text[]      DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read blogs" ON blog_posts;
CREATE POLICY "Public read blogs" ON blog_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service insert blogs" ON blog_posts;
CREATE POLICY "Service insert blogs" ON blog_posts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service update blogs" ON blog_posts;
CREATE POLICY "Service update blogs" ON blog_posts FOR UPDATE
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON blog_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx         ON blog_posts (slug);
