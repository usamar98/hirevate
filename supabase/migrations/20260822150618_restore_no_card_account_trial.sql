-- Restore the activation-friendly trial: it begins when an account is created,
-- requires no payment method, and never converts to a paid subscription.
comment on column public.profiles.stripe_trial_started_at is
  'Legacy Stripe-backed trial marker retained for subscription history; account trials use profiles.created_at.';
comment on column public.profiles.trial_reminder_email_id is
  'Resend email ID for the account-trial membership reminder.';
comment on column public.profiles.trial_reminder_scheduled_for is
  'Scheduled delivery time for the account-trial membership reminder.';

create or replace function public.reserve_trial_feature(p_feature text)
returns table (
  allowed boolean,
  remaining integer,
  trial_ends_at timestamptz,
  denial_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_created_at timestamptz;
  v_subscription_status text;
  v_stripe_subscription_status text;
  v_role text;
  v_limit integer;
  v_period_key text;
  v_usage_count integer;
  v_trial_ends_at timestamptz;
begin
  if v_user_id is null then
    return query select false, 0, null::timestamptz, 'unauthenticated'::text;
    return;
  end if;

  select
    profile.created_at,
    profile.subscription_status,
    profile.stripe_subscription_status,
    profile.role
  into
    v_created_at,
    v_subscription_status,
    v_stripe_subscription_status,
    v_role
  from public.profiles as profile
  where profile.id = v_user_id;

  if not found then
    return query select false, 0, null::timestamptz, 'profile_missing'::text;
    return;
  end if;

  v_trial_ends_at := v_created_at + interval '3 days';

  if lower(coalesce(v_role, '')) in ('admin', 'superadmin', 'super_admin')
    or lower(coalesce(v_stripe_subscription_status, '')) = 'active'
    or (
      nullif(v_stripe_subscription_status, '') is null
      and lower(coalesce(v_subscription_status, '')) in (
        'active', 'pro', 'annual', 'starter', 'silver', 'gold', 'platinum'
      )
    ) then
    return query select true, null::integer, v_trial_ends_at, null::text;
    return;
  end if;

  if statement_timestamp() >= v_trial_ends_at then
    return query select false, 0, v_trial_ends_at, 'trial_expired'::text;
    return;
  end if;

  v_limit := case p_feature
    when 'job_apply' then 2
    when 'job_resume' then 1
    when 'cover_letter' then 1
    else null
  end;

  if v_limit is null then
    return query select false, 0, v_trial_ends_at, 'invalid_feature'::text;
    return;
  end if;

  v_period_key := case
    when p_feature = 'job_apply'
      then to_char(timezone('UTC', statement_timestamp()), 'YYYY-MM-DD')
    else 'trial'
  end;

  insert into public.trial_feature_usage as usage (
    user_id,
    feature,
    period_key,
    usage_count
  )
  values (v_user_id, p_feature, v_period_key, 1)
  on conflict (user_id, feature, period_key)
  do update set
    usage_count = usage.usage_count + 1,
    updated_at = statement_timestamp()
  where usage.usage_count < v_limit
  returning usage.usage_count into v_usage_count;

  if v_usage_count is null then
    return query select false, 0, v_trial_ends_at, 'feature_limit_reached'::text;
    return;
  end if;

  return query
    select true, greatest(v_limit - v_usage_count, 0), v_trial_ends_at, null::text;
end;
$$;

revoke all on function public.reserve_trial_feature(text) from public, anon;
grant execute on function public.reserve_trial_feature(text) to authenticated;
