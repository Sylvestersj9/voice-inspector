-- Create feedback table for contact form submissions
-- This migration creates the feedback table if it doesn't exist

create table if not exists public.feedback (
  id bigint primary key generated always as identity,
  type text default 'feedback' check (type in ('contact', 'feedback')),
  name text,
  email text,
  message text not null,
  user_agent text,
  status text default 'received' check (status in ('received', 'sent', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add indexes
create index if not exists idx_feedback_email on public.feedback(email);
create index if not exists idx_feedback_status on public.feedback(status);
create index if not exists idx_feedback_created_at on public.feedback(created_at desc);

-- Enable RLS
alter table if exists public.feedback enable row level security;

-- Allow anyone to insert (service role handles auth)
drop policy if exists "Enable insert for feedback" on public.feedback;
create policy "Enable insert for feedback"
  on public.feedback
  for insert
  with check (true);

-- Only service role can read/update
drop policy if exists "Service role can manage feedback" on public.feedback;
create policy "Service role can manage feedback"
  on public.feedback
  for all
  using (auth.role() = 'service_role');
