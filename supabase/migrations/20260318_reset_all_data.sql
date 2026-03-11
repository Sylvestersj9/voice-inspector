-- RESET: Delete all user data and records
-- This truncates all tables containing user data while preserving the schema

-- Truncate all tables (cascade will handle foreign key relationships)
-- Order matters due to foreign key constraints
truncate table public.responses cascade;
truncate table public.sessions cascade;
truncate table public.subscriptions cascade;
truncate table public.users cascade;
truncate table public.feedback cascade;
truncate table public.blog_posts cascade;

-- Reset sequences if any
alter sequence if exists public.feedback_id_seq restart with 1;
