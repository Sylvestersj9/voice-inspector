-- Promo codes table for personalised discounts
create table public.promo_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  description text,
  stripe_coupon_id text,
  discount_percent integer not null default 10,
  max_redemptions integer,
  times_redeemed integer not null default 0,
  expires_at  timestamptz,
  created_at  timestamptz default now()
);

alter table public.promo_codes enable row level security;

-- No RLS policies — admin-only access via service role
-- Public can see codes (needed for Stripe to validate) but not modify
create policy "Anyone can view promo codes" on public.promo_codes
  for select using (true);

create policy "Only service role can modify promo codes" on public.promo_codes
  for insert with check (false);

create policy "Only service role can update promo codes" on public.promo_codes
  for update using (false);

create policy "Only service role can delete promo codes" on public.promo_codes
  for delete using (false);
