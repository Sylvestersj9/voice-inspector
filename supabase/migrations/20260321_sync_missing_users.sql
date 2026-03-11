-- Sync any auth.users that don't have corresponding public.users rows
-- This can happen if triggers didn't fire during OAuth signup

insert into public.users (id, name, created_at)
select
  au.id,
  coalesce(au.raw_user_meta_data->>'name', au.email, ''),
  au.created_at
from auth.users au
where not exists (select 1 from public.users pu where pu.id = au.id)
on conflict (id) do nothing;

-- Ensure subscriptions exist for all users without them
insert into public.subscriptions (user_id, status, trial_used, created_at)
select
  pu.id,
  'trialing',
  false,
  now()
from public.users pu
where not exists (select 1 from public.subscriptions ps where ps.user_id = pu.id)
on conflict (user_id) do nothing;
