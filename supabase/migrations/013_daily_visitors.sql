create table if not exists public.daily_visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_hash text not null,
  visit_date date not null,
  user_id uuid references auth.users(id) on delete set null,
  entry_path text not null,
  last_path text not null,
  country_code text,
  country_name text,
  page_views integer default 1 not null check (page_views > 0),
  first_seen_at timestamp with time zone default now() not null,
  last_seen_at timestamp with time zone default now() not null,
  unique(visitor_hash, visit_date)
);

create index if not exists daily_visitors_date_idx
  on public.daily_visitors(visit_date desc);

create index if not exists daily_visitors_user_idx
  on public.daily_visitors(user_id, visit_date desc)
  where user_id is not null;

alter table public.daily_visitors enable row level security;

revoke all on public.daily_visitors from anon, authenticated;
grant select on public.daily_visitors to service_role;

create or replace function public.record_daily_visit(
  p_visitor_hash text,
  p_visit_date date,
  p_user_id uuid,
  p_path text,
  p_country_code text,
  p_country_name text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.daily_visitors (
    visitor_hash,
    visit_date,
    user_id,
    entry_path,
    last_path,
    country_code,
    country_name
  )
  values (
    p_visitor_hash,
    p_visit_date,
    p_user_id,
    p_path,
    p_path,
    p_country_code,
    p_country_name
  )
  on conflict (visitor_hash, visit_date) do update
  set
    user_id = coalesce(excluded.user_id, public.daily_visitors.user_id),
    last_path = excluded.last_path,
    country_code = coalesce(public.daily_visitors.country_code, excluded.country_code),
    country_name = coalesce(public.daily_visitors.country_name, excluded.country_name),
    page_views = public.daily_visitors.page_views + 1,
    last_seen_at = now();
$$;

revoke all on function public.record_daily_visit(text, date, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.record_daily_visit(text, date, uuid, text, text, text) to service_role;
