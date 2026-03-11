-- Temporarily disable welcome-email trigger to fix signup issues
-- The trigger was blocking signup due to pg_net configuration issues
-- We'll rely on the manual welcome email call in Login.tsx instead

drop trigger if exists on_user_created_welcome on public.users;
