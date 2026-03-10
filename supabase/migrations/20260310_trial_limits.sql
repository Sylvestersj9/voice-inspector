-- Enforce trial limits at the database level for session creation.
-- Trial: 3 days from subscription creation, 5 sessions/day, 15 total.

drop policy if exists "Users can insert own sessions" on public.sessions;

create policy "Users can insert own sessions within trial limits"
  on public.sessions for insert
  with check (
    auth.uid() = user_id
    and (
      -- Paid subscribers: allow unlimited sessions
      exists (
        select 1
        from public.subscriptions s
        where s.user_id = auth.uid()
          and (
            s.status = 'active'
            or (s.status = 'trialing' and s.stripe_subscription_id is not null)
          )
      )
      or (
        -- Trial users: 3 days, 5 per day, 15 total
        exists (select 1 from public.subscriptions s where s.user_id = auth.uid())
        and now() <= (
          select s.created_at + interval '3 days'
          from public.subscriptions s
          where s.user_id = auth.uid()
        )
        and (
          select count(*)
          from public.sessions s2
          where s2.user_id = auth.uid()
            and s2.started_at >= (
              select s.created_at
              from public.subscriptions s
              where s.user_id = auth.uid()
            )
        ) < 15
        and (
          select count(*)
          from public.sessions s3
          where s3.user_id = auth.uid()
            and s3.started_at::date = now()::date
        ) < 5
      )
    )
  );
