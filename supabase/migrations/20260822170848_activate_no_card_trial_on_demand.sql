-- Start the no-card account trial when the member explicitly asks for it.
-- The marker is immutable through the public API, so each account receives one trial.
alter table public.profiles
  add column if not exists free_trial_started_at timestamptz;

-- Preserve trials that are active under the previous account-created-at model.
update public.profiles
set free_trial_started_at = created_at
where free_trial_started_at is null
  and created_at > statement_timestamp() - interval '3 days';

-- New profiles start their trial when signup completes. Older profiles remain
-- eligible to activate explicitly through start_account_trial().
alter table public.profiles
  alter column free_trial_started_at set default statement_timestamp();

comment on column public.profiles.free_trial_started_at is
  'Server-owned start time for the one-time, no-card account trial.';

create index if not exists profiles_free_trial_started_at_idx
  on public.profiles (free_trial_started_at)
  where free_trial_started_at is not null;

create or replace function public.start_account_trial()
returns table (
  started boolean,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trial_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_trial_started_at timestamptz;
  v_started boolean := false;
begin
  if v_user_id is null then
    return query
      select false, null::timestamptz, null::timestamptz, 'unauthenticated'::text;
    return;
  end if;

  update public.profiles as profile
  set free_trial_started_at = statement_timestamp()
  where profile.id = v_user_id
    and profile.free_trial_started_at is null
  returning profile.free_trial_started_at into v_trial_started_at;

  if found then
    v_started := true;
  else
    select profile.free_trial_started_at
      into v_trial_started_at
    from public.profiles as profile
    where profile.id = v_user_id;

    if not found then
      return query
        select false, null::timestamptz, null::timestamptz, 'profile_missing'::text;
      return;
    end if;
  end if;

  return query
    select
      v_started,
      v_trial_started_at,
      v_trial_started_at + interval '3 days',
      case
        when statement_timestamp() < v_trial_started_at + interval '3 days' then 'active'::text
        else 'expired'::text
      end;
end;
$$;

revoke all on function public.start_account_trial() from public, anon;
grant execute on function public.start_account_trial() to authenticated;

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
  v_trial_started_at timestamptz;
  v_subscription_status text;
  v_stripe_subscription_status text;
  v_role text;
  v_limit integer;
  v_period_key text;
  v_trial_key text;
  v_usage_count integer;
  v_trial_ends_at timestamptz;
begin
  if v_user_id is null then
    return query select false, 0, null::timestamptz, 'unauthenticated'::text;
    return;
  end if;

  select
    profile.free_trial_started_at,
    profile.subscription_status,
    profile.stripe_subscription_status,
    profile.role
  into
    v_trial_started_at,
    v_subscription_status,
    v_stripe_subscription_status,
    v_role
  from public.profiles as profile
  where profile.id = v_user_id;

  if not found then
    return query select false, 0, null::timestamptz, 'profile_missing'::text;
    return;
  end if;

  if lower(coalesce(v_role, '')) in ('admin', 'superadmin', 'super_admin')
    or lower(coalesce(v_stripe_subscription_status, '')) = 'active'
    or (
      nullif(v_stripe_subscription_status, '') is null
      and lower(coalesce(v_subscription_status, '')) in (
        'active', 'pro', 'annual', 'starter', 'silver', 'gold', 'platinum'
      )
    ) then
    return query
      select
        true,
        null::integer,
        case
          when v_trial_started_at is null then null::timestamptz
          else v_trial_started_at + interval '3 days'
        end,
        null::text;
    return;
  end if;

  if v_trial_started_at is null then
    return query select false, 0, null::timestamptz, 'trial_not_started'::text;
    return;
  end if;

  v_trial_ends_at := v_trial_started_at + interval '3 days';
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

  v_trial_key := 'trial:' || to_char(
    timezone('UTC', v_trial_started_at),
    'YYYYMMDDHH24MISSUS'
  );
  v_period_key := case
    when p_feature = 'job_apply'
      then v_trial_key || ':' || to_char(timezone('UTC', statement_timestamp()), 'YYYY-MM-DD')
    else v_trial_key
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

create or replace function public.release_trial_feature(
  p_user_id uuid,
  p_feature text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trial_started_at timestamptz;
  v_trial_key text;
  v_period_key text;
begin
  select profile.free_trial_started_at
    into v_trial_started_at
  from public.profiles as profile
  where profile.id = p_user_id;

  if v_trial_started_at is null then
    return;
  end if;

  v_trial_key := 'trial:' || to_char(
    timezone('UTC', v_trial_started_at),
    'YYYYMMDDHH24MISSUS'
  );
  v_period_key := case
    when p_feature = 'job_apply'
      then v_trial_key || ':' || to_char(timezone('UTC', statement_timestamp()), 'YYYY-MM-DD')
    when p_feature in ('job_resume', 'cover_letter')
      then v_trial_key
    else null
  end;

  if v_period_key is null then
    return;
  end if;

  update public.trial_feature_usage as usage
  set
    usage_count = greatest(usage.usage_count - 1, 0),
    updated_at = statement_timestamp()
  where usage.user_id = p_user_id
    and usage.feature = p_feature
    and usage.period_key = v_period_key
    and usage.usage_count > 0;
end;
$$;

revoke all on function public.release_trial_feature(uuid, text)
  from public, anon, authenticated;
grant execute on function public.release_trial_feature(uuid, text) to service_role;
