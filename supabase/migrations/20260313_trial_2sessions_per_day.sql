-- Update trial limits: 5/day → 2/day, 15 total → 6 total.
-- Anti-abuse: stricter daily cap while keeping 3-day window.

drop policy if exists "Users can insert own sessions within trial limits" on public.sessions;

create policy "Users can insert own sessions within trial limits"
  on public.sessions for insert
  with check (
    auth.uid() = user_id
    and (
      -- Paid subscribers: unlimited
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
        -- Trial: 3 days from signup, max 2/day, max 6 total
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
        ) < 6
        and (
          select count(*)
          from public.sessions s3
          where s3.user_id = auth.uid()
            and s3.started_at::date = now()::date
        ) < 2
      )
    )
  );
