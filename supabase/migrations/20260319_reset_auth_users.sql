-- RESET: Delete all auth users
-- First truncate any orphaned inspection tables if they exist
truncate table public.inspection_answers cascade;
truncate table public.inspection_session_questions cascade;
truncate table public.inspection_evaluations cascade;
truncate table public.inspection_reports cascade;
truncate table public.inspection_sessions cascade;

-- Now delete all users from auth.users (cascades to public.users, subscriptions, sessions, responses)
delete from auth.users;
