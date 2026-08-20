-- Capture Stripe lifecycle state separately from the product entitlement.
-- These fields are server-owned because the existing profiles policies only allow
-- authenticated users to update their public profile fields.
alter table public.profiles
  add column if not exists stripe_subscription_status text,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_updated_at timestamptz;

create index if not exists profiles_stripe_subscription_status_idx
  on public.profiles(stripe_subscription_status);

create index if not exists profiles_subscription_cancel_at_period_end_idx
  on public.profiles(subscription_cancel_at_period_end)
  where subscription_cancel_at_period_end = true;
