create table if not exists public.job_source_health (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_key text not null,
  display_name text not null,
  status text default 'active' not null check (status in ('active', 'cooldown', 'disabled')),
  consecutive_failures integer default 0 not null check (consecutive_failures >= 0),
  total_successes integer default 0 not null check (total_successes >= 0),
  total_failures integer default 0 not null check (total_failures >= 0),
  last_success_at timestamp with time zone,
  last_failure_at timestamp with time zone,
  disabled_until timestamp with time zone,
  last_error text,
  last_jobs_fetched integer default 0 not null check (last_jobs_fetched >= 0),
  last_jobs_inserted integer default 0 not null check (last_jobs_inserted >= 0),
  average_jobs_fetched numeric(10, 2) default 0 not null check (average_jobs_fetched >= 0),
  inserted_today integer default 0 not null check (inserted_today >= 0),
  checked_today_at date,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (source, source_key)
);

create index if not exists job_source_health_source_status_idx
  on public.job_source_health (source, status, disabled_until);

create index if not exists job_source_health_updated_idx
  on public.job_source_health (updated_at desc);

alter table public.job_source_health enable row level security;

revoke all on public.job_source_health from anon, authenticated;
grant all on public.job_source_health to service_role;