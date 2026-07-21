-- The Auth trigger was missing in production, leaving most existing users without profiles.
-- Restore only missing rows so existing roles, subscription state, and Stripe IDs stay untouched.
insert into public.profiles (
  id,
  email,
  full_name,
  country_code,
  country_name,
  last_seen_at,
  created_at
)
select
  auth_user.id,
  auth_user.email,
  coalesce(auth_user.raw_user_meta_data ->> 'full_name', ''),
  nullif(auth_user.raw_user_meta_data ->> 'country_code', ''),
  nullif(auth_user.raw_user_meta_data ->> 'country_name', ''),
  coalesce(auth_user.last_sign_in_at, auth_user.created_at, now()),
  coalesce(auth_user.created_at, now())
from auth.users as auth_user
where not exists (
  select 1
  from public.profiles as existing_profile
  where existing_profile.id = auth_user.id
)
on conflict (id) do nothing;
