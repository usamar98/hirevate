create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(upper(btrim(new.raw_user_meta_data ->> 'country_code')), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'country_name'), ''),
    new.last_sign_in_at
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;
revoke all on function private.handle_new_user() from anon;
revoke all on function private.handle_new_user() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

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
  users.id,
  users.email,
  nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
  nullif(upper(btrim(users.raw_user_meta_data ->> 'country_code')), ''),
  nullif(btrim(users.raw_user_meta_data ->> 'country_name'), ''),
  users.last_sign_in_at,
  users.created_at
from auth.users
as users
on conflict (id) do nothing;
