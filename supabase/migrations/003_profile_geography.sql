alter table public.profiles
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists last_seen_at timestamp with time zone;

create index if not exists profiles_subscription_status_idx
  on public.profiles(subscription_status);

create index if not exists profiles_country_code_idx
  on public.profiles(country_code);

create index if not exists profiles_created_at_idx
  on public.profiles(created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    country_code,
    country_name,
    last_seen_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'country_code', ''),
    nullif(new.raw_user_meta_data ->> 'country_name', ''),
    now()
  )
  on conflict (id) do update
  set
    email = coalesce(public.profiles.email, excluded.email),
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    country_code = coalesce(public.profiles.country_code, excluded.country_code),
    country_name = coalesce(public.profiles.country_name, excluded.country_name),
    last_seen_at = coalesce(public.profiles.last_seen_at, excluded.last_seen_at);

  return new;
end;
$$;
