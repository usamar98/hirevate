alter table public.jobs
  add column if not exists last_link_checked_at timestamp with time zone,
  add column if not exists link_check_failures smallint not null default 0;

alter table public.jobs
  drop constraint if exists jobs_link_check_failures_range;

alter table public.jobs
  add constraint jobs_link_check_failures_range
  check (link_check_failures between 0 and 2);

create index if not exists jobs_active_link_revalidation_idx
  on public.jobs(link_check_failures desc, last_link_checked_at asc nulls first)
  where status = 'active' and apply_url is not null;
