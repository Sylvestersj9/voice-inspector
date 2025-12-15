-- Action plans per inspection session

create table if not exists inspection_action_plans (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references inspection_sessions(id) on delete cascade,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists inspection_action_plans_session_idx
on inspection_action_plans (session_id);

alter table inspection_action_plans enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='inspection_action_plans' and policyname='action_plans_read_write'
  ) then
    create policy action_plans_read_write on inspection_action_plans for all
      using (
        session_id in (
          select s.id from inspection_sessions s
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      )
      with check (
        session_id in (
          select s.id from inspection_sessions s
          join homes h on h.id = s.home_id
          where h.organisation_id in (select current_user_org_ids())
        )
      );
  end if;
end $$;
