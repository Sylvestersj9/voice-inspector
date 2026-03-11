-- Add account status tracking to users table
-- Allows us to mark deleted accounts without removing records

alter table public.users add column if not exists status text not null default 'active'; -- 'active' | 'deleted'
alter table public.users add column if not exists deleted_at timestamp with time zone;

-- Update RLS policy to prevent deleted users from accessing data
drop policy if exists "Users can view own sessions" on public.sessions;
create policy "Users can view own sessions"
  on public.sessions for select
  using (
    auth.uid() = user_id
    and exists (select 1 from public.users u where u.id = auth.uid() and u.status = 'active')
  );

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id and status = 'active');

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id and status = 'active');

-- Add comment
comment on column public.users.status is 'Account status: active or deleted. Deleted accounts retain records for reference but cannot access the service.';
comment on column public.users.deleted_at is 'Timestamp when account was deleted. NULL if account is active.';
