alter table public.jobs
  add column if not exists last_seen_at timestamp with time zone default now();

update public.jobs
set last_seen_at = coalesce(last_seen_at, updated_at, discovered_at, now())
where last_seen_at is null;

create index if not exists jobs_status_last_seen_idx
  on public.jobs(status, last_seen_at desc);
