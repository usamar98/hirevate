-- Keep the public job inventory limited to listings seen by a source in the last 10 days.
-- Saved jobs and job views are removed by their existing cascading foreign keys.
-- Tracked applications are preserved because job_applications.job_id uses ON DELETE SET NULL.

set local lock_timeout = '10s';
set local statement_timeout = '5min';

create or replace function public.mark_deleted_job_applications_unavailable()
returns trigger
language plpgsql
set search_path = public
as $job_retention$
begin
  update public.job_applications
  set
    listing_status = 'unavailable',
    listing_last_checked_at = coalesce(old.last_seen_at, old.updated_at, old.discovered_at, now()),
    listing_closed_at = coalesce(listing_closed_at, now())
  where job_id = old.id;

  return old;
end;
$job_retention$;

revoke execute on function public.mark_deleted_job_applications_unavailable() from public, anon, authenticated;

drop trigger if exists mark_deleted_job_applications_unavailable_trigger on public.jobs;
create trigger mark_deleted_job_applications_unavailable_trigger
  before delete on public.jobs
  for each row
  execute function public.mark_deleted_job_applications_unavailable();

create index if not exists jobs_retention_last_seen_idx
  on public.jobs(last_seen_at);

-- Apply the retention rule immediately when this migration is deployed.
delete from public.jobs
where coalesce(last_seen_at, updated_at, discovered_at) < now() - interval '10 days';

-- Database-level enforcement is independent of the application/Vercel sync cron.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

do $job_retention_schedule$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobid
    from cron.job
    where jobname = 'hirevate-delete-jobs-older-than-10-days'
  loop
    perform cron.unschedule(existing_job_id);
  end loop;
end;
$job_retention_schedule$;

select cron.schedule(
  'hirevate-delete-jobs-older-than-10-days',
  '0 5 * * *',
  $job_retention_cron$
    delete from public.jobs
    where coalesce(last_seen_at, updated_at, discovered_at) < now() - interval '10 days';
  $job_retention_cron$
);
