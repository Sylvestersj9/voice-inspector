-- Phase 3: Inspection Feedback Submission
-- Allows users to submit feedback after inspections/interviews for public gallery

create table public.inspection_feedback (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  session_id       uuid references public.sessions(id) on delete set null,

  -- Feedback metadata
  feedback_type    text not null check (feedback_type in ('inspection', 'interview', 'practice')),
  -- inspection = post-Ofsted inspection feedback
  -- interview = post-fit-person interview feedback
  -- practice = feedback on MockOfsted practice sessions

  title            text not null,
  description      text not null,

  -- Outcomes & impact
  outcome          text check (outcome in ('good', 'outstanding', 'requires_improvement', 'inadequate', 'passed', 'needs_work', 'preparing')),
  key_learning     text,

  -- Optional context
  home_setting     text,
  role_at_time     text,

  -- Privacy
  is_public        boolean default false,
  is_anonymised    boolean default true,
  consent_to_share boolean default false,

  -- Lifecycle
  submitted_at     timestamptz default now(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Enable RLS
alter table public.inspection_feedback enable row level security;

-- RLS: Users can read only their own unpublished, or any published feedback
create policy "Users can view own feedback and public feedback"
on public.inspection_feedback
for select
using (
  auth.uid() = user_id
  or is_public = true
);

-- RLS: Users can insert their own feedback
create policy "Users can submit own feedback"
on public.inspection_feedback
for insert
with check (auth.uid() = user_id);

-- RLS: Users can update their own feedback (non-public)
create policy "Users can edit own feedback before publishing"
on public.inspection_feedback
for update
using (auth.uid() = user_id and is_public = false)
with check (auth.uid() = user_id);

-- Index for fast queries (user_id, submitted_at) as recommended
create index idx_inspection_feedback_user_submitted
on public.inspection_feedback(user_id, submitted_at desc);

-- Index for public gallery queries
create index idx_inspection_feedback_public
on public.inspection_feedback(is_public, created_at desc)
where is_public = true;

-- Index for feedback type queries
create index idx_inspection_feedback_type
on public.inspection_feedback(feedback_type, created_at desc);

-- Trigger to update updated_at
create or replace function update_inspection_feedback_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger inspection_feedback_timestamp_trigger
before update on public.inspection_feedback
for each row
execute function update_inspection_feedback_timestamp();
