-- InspectReady MVP Schema
-- Run this in the Supabase SQL editor or via CLI

-- ── users ────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  role       text, -- 'Registered Manager' | 'Deputy Manager' | 'Responsible Individual'
  home_name  text,
  created_at timestamp with time zone default now()
);

alter table public.users enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ── subscriptions ─────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  status                  text not null default 'trialing', -- 'active' | 'trialing' | 'cancelled' | 'past_due'
  trial_used              boolean not null default false,
  created_at              timestamp with time zone default now(),
  updated_at              timestamp with time zone default now()
);

create unique index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role (Edge Functions) can do everything
drop policy if exists "Service role full access on subscriptions" on public.subscriptions;
create policy "Service role full access on subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- ── sessions ──────────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  started_at    timestamp with time zone default now(),
  completed_at  timestamp with time zone,
  overall_band  text,
  overall_score numeric,
  report_json   jsonb
);

alter table public.sessions enable row level security;

drop policy if exists "Users can view own sessions" on public.sessions;
create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.sessions;
create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

-- ── responses ─────────────────────────────────────────────────────────────────
create table if not exists public.responses (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  domain        text not null,
  question_text text not null,
  answer_text   text,
  score         integer,
  band          text,
  feedback_json jsonb,
  created_at    timestamp with time zone default now()
);

alter table public.responses enable row level security;

drop policy if exists "Users can view own responses" on public.responses;
create policy "Users can view own responses"
  on public.responses for select
  using (
    exists (
      select 1 from public.sessions s
      where s.id = responses.session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own responses" on public.responses;
create policy "Users can insert own responses"
  on public.responses for insert
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = responses.session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own responses" on public.responses;
create policy "Users can update own responses"
  on public.responses for update
  using (
    exists (
      select 1 from public.sessions s
      where s.id = responses.session_id and s.user_id = auth.uid()
    )
  );

-- ── Helper function: auto-create user profile on signup ──────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.users (id, name, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Helper function: auto-create subscription row on signup ──────────────────
create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.subscriptions (user_id, status, trial_used)
  values (new.id, 'trialing', false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_user_created on public.users;
create trigger on_user_created
  after insert on public.users
  for each row execute procedure public.handle_new_subscription();
