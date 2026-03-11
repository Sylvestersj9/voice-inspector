-- Ensure user and subscription creation triggers are in place for OAuth signups
-- These triggers auto-populate public.users and public.subscriptions when auth.users is created

-- Recreate the handle_new_user function
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, name, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop and recreate the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Recreate the handle_new_subscription function
create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, status, trial_used)
  values (new.id, 'trialing', false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Drop and recreate the subscription trigger
drop trigger if exists on_auth_user_subscription on public.users;
create trigger on_auth_user_subscription
  after insert on public.users
  for each row execute procedure public.handle_new_subscription();
