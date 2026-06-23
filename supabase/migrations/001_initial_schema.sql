create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'user' not null,
  subscription_status text default 'free' not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  greenhouse_slug text not null unique,
  industry text,
  is_active boolean default true not null,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  external_id text not null,
  title text not null,
  description text,
  location text,
  remote_type text,
  source text default 'greenhouse',
  source_url text,
  apply_url text,
  posted_at timestamp with time zone,
  discovered_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone,
  freshness_score integer default 50 not null,
  status text default 'active' not null,
  raw_data jsonb,
  unique(company_id, external_id)
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  unique(user_id, job_id)
);

create table if not exists public.job_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  viewed_at timestamp with time zone default now() not null
);

create index if not exists companies_active_idx on public.companies(is_active);
create index if not exists jobs_status_discovered_idx on public.jobs(status, discovered_at desc);
create index if not exists jobs_freshness_idx on public.jobs(freshness_score desc);
create index if not exists jobs_title_trgm_idx on public.jobs using gin (title gin_trgm_ops);
create index if not exists jobs_location_trgm_idx on public.jobs using gin (location gin_trgm_ops);
create index if not exists saved_jobs_user_idx on public.saved_jobs(user_id, created_at desc);
create index if not exists job_views_user_viewed_idx on public.job_views(user_id, viewed_at desc);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_views enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Users can update own editable profile fields" on public.profiles;
create policy "Users can update own editable profile fields"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Public can read active companies" on public.companies;
create policy "Public can read active companies"
  on public.companies for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active jobs" on public.jobs;
create policy "Public can read active jobs"
  on public.jobs for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Users can read own saved jobs" on public.saved_jobs;
create policy "Users can read own saved jobs"
  on public.saved_jobs for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can save own jobs" on public.saved_jobs;
create policy "Users can save own jobs"
  on public.saved_jobs for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own saved jobs" on public.saved_jobs;
create policy "Users can delete own saved jobs"
  on public.saved_jobs for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read own job views" on public.job_views;
create policy "Users can read own job views"
  on public.job_views for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own job views" on public.job_views;
create policy "Users can insert own job views"
  on public.job_views for insert
  to authenticated
  with check (user_id = auth.uid());

-- Keep sensitive subscription and role fields server-owned. Authenticated users can only edit
-- full_name, while service role backend code can update billing/admin fields.
revoke update on public.profiles from authenticated;
revoke insert on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.profiles to authenticated;
grant insert (id, email, full_name) on public.profiles to authenticated;
grant select on public.companies to anon, authenticated;
grant select on public.jobs to anon, authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;
grant select, insert on public.job_views to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
