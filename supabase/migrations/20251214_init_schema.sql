-- 0) Extensions (needed for gen_random_uuid)
create extension if not exists pgcrypto;

-- 1) Profiles upgrades
alter table profiles add column if not exists role text default 'manager';
update profiles set role = 'manager' where role is null;

-- 2) Orgs / Homes / Memberships (base)
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  created_by uuid references profiles(id)
);

create table if not exists homes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  organisation_id uuid references organisations(id) on delete cascade,
  name text not null,
  ofsted_urn text null
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  organisation_id uuid references organisations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role text not null
);

-- 3) Inspection sessions
create table if not exists inspection_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by uuid references profiles(id),
  status text default 'draft',
  title text
);

alter table inspection_sessions add column if not exists home_id uuid references homes(id);

-- 4) Framework + snapshot
create table if not exists inspection_frameworks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  version text not null,
  is_active boolean default true
);

create table if not exists inspection_domains (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid references inspection_frameworks(id) on delete cascade,
  name text not null,
  sort_order int not null
);

create table if not exists inspection_questions (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references inspection_domains(id) on delete cascade,
  text text not null,
  guidance text null,
  sort_order int not null
);

create table if not exists inspection_session_questions (
  id uuid primary key default gen_random_uuid(),
  inspection_session_id uuid references inspection_sessions(id) on delete cascade,
  domain_name text not null,
  question_text text not null,
  guidance text null,
  sort_order int not null
);

-- 5) Answers
create table if not exists inspection_answers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  inspection_session_question_id uuid references inspection_session_questions(id) on delete cascade,
  answered_by uuid references profiles(id),
  answer_text text null,
  transcript text null,
  evidence_notes text null
);

create unique index if not exists unique_answer_per_question
on inspection_answers (inspection_session_question_id);

-- 6) Evaluations
create table if not exists inspection_evaluations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  inspection_session_question_id uuid references inspection_session_questions(id) on delete cascade,
  evaluated_by text default 'ai',
  score int not null,
  band text not null,
  strengths text not null,
  gaps text not null,
  follow_up_questions text not null
);

create unique index if not exists unique_eval_per_question
on inspection_evaluations (inspection_session_question_id);

-- 7) Reports
create table if not exists inspection_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  inspection_session_id uuid references inspection_sessions(id) on delete cascade,
  overall_score numeric not null,
  overall_band text not null,
  strengths text not null,
  key_risks text not null,
  recommended_actions text not null
);

create unique index if not exists unique_report_per_session
on inspection_reports (inspection_session_id);

-- 8) Audit
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb
);

-- 9) Billing
create table if not exists organisation_billing (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  plan text not null,
  status text not null,
  current_period_end timestamptz
);

create unique index if not exists unique_billing_org
on organisation_billing (organisation_id);

-- 10) RLS enablement
alter table organisations enable row level security;
alter table homes enable row level security;
alter table memberships enable row level security;
alter table inspection_sessions enable row level security;
alter table inspection_session_questions enable row level security;
alter table inspection_answers enable row level security;
alter table inspection_evaluations enable row level security;
alter table inspection_reports enable row level security;
alter table audit_logs enable row level security;
alter table organisation_billing enable row level security;

-- 11) Helper function
create or replace function current_user_org_ids()
returns setof uuid
language sql
as $$
  select organisation_id
  from memberships
  where profile_id = auth.uid()
$$;

-- 12) Policies (create only if missing)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='organisations' and policyname='org_read') then
    create policy org_read on organisations for select
      using (id in (select current_user_org_ids()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='homes' and policyname='homes_read_write') then
    create policy homes_read_write on homes for all
      using (organisation_id in (select current_user_org_ids()))
      with check (organisation_id in (select current_user_org_ids()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='memberships' and policyname='memberships_read') then
    create policy memberships_read on memberships for select
      using (profile_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inspection_sessions' and policyname='inspections_read_write') then
    create policy inspections_read_write on inspection_sessions for all
      using (
        home_id in (select id from homes where organisation_id in (select current_user_org_ids()))
      )
      with check (
        home_id in (select id from homes where organisation_id in (select current_user_org_ids()))
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inspection_session_questions' and policyname='session_questions_read_write') then
    create policy session_questions_read_write on inspection_session_questions for all
      using (
        inspection_session_id in (
          select s.id from inspection_sessions s
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      )
      with check (
        inspection_session_id in (
          select s.id from inspection_sessions s
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inspection_answers' and policyname='answers_read_write') then
    create policy answers_read_write on inspection_answers for all
      using (
        inspection_session_question_id in (
          select q.id from inspection_session_questions q
          join inspection_sessions s on s.id = q.inspection_session_id
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      )
      with check (
        inspection_session_question_id in (
          select q.id from inspection_session_questions q
          join inspection_sessions s on s.id = q.inspection_session_id
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inspection_evaluations' and policyname='evaluations_read_write') then
    create policy evaluations_read_write on inspection_evaluations for all
      using (
        inspection_session_question_id in (
          select q.id from inspection_session_questions q
          join inspection_sessions s on s.id = q.inspection_session_id
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      )
      with check (
        inspection_session_question_id in (
          select q.id from inspection_session_questions q
          join inspection_sessions s on s.id = q.inspection_session_id
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inspection_reports' and policyname='reports_read_write') then
    create policy reports_read_write on inspection_reports for all
      using (
        inspection_session_id in (
          select s.id from inspection_sessions s
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      )
      with check (
        inspection_session_id in (
          select s.id from inspection_sessions s
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='audit_insert_only') then
    create policy audit_insert_only on audit_logs for insert
      with check (actor_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='audit_read') then
    create policy audit_read on audit_logs for select
      using (actor_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='organisation_billing' and policyname='billing_read') then
    create policy billing_read on organisation_billing for select
      using (organisation_id in (select current_user_org_ids()));
  end if;
end $$;
