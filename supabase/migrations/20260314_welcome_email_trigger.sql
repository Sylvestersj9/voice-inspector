-- Welcome email trigger
-- Fires after a new row is inserted into public.users
-- Calls the welcome-email edge function via pg_net (enabled by default on Supabase)
--
-- ONE-TIME SETUP (run once in SQL editor, not re-run on every migration):
--   ALTER DATABASE postgres SET app.supabase_url = 'https://hedxbcpqcgtsqjogedru.supabase.co';
--   ALTER DATABASE postgres SET app.service_role_key = '<your-service-role-key>';
-- Then reload: SELECT pg_reload_conf();

create or replace function public.handle_welcome_email()
returns trigger
language plpgsql
security definer
as $$
declare
  _payload jsonb;
  _url     text;
  _key     text;
begin
  -- Fallback to hardcoded URL if setting not present
  _url  := coalesce(
    nullif(current_setting('app.supabase_url', true), ''),
    'https://hedxbcpqcgtsqjogedru.supabase.co'
  ) || '/functions/v1/welcome-email';
  _key  := current_setting('app.service_role_key', true);

  _payload := jsonb_build_object(
    'user_id', NEW.id,
    'name',    coalesce(NEW.name, '')
  );

  -- Fire-and-forget HTTP POST via pg_net
  perform net.http_post(
    url     := _url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body    := _payload::text
  );

  return NEW;
end;
$$;

drop trigger if exists on_user_created_welcome on public.users;
create trigger on_user_created_welcome
  after insert on public.users
  for each row
  execute procedure public.handle_welcome_email();
