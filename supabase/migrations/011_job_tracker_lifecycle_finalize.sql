-- Safe continuation when migration 010 previously stopped at its status trigger function.
-- This file is idempotent and is also safe after a complete successful run of migration 010.

create or replace function public.set_job_application_status_changed_at()
returns trigger
language plpgsql
set search_path = public
as $job_tracker$
begin
  if old.status is distinct from new.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$job_tracker$;

drop trigger if exists set_job_application_status_changed_at_trigger on public.job_applications;
create trigger set_job_application_status_changed_at_trigger
  before update of status
  on public.job_applications
  for each row
  execute function public.set_job_application_status_changed_at();

create or replace function public.log_job_application_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $job_tracker$
declare
  event_name text;
begin
  if tg_op = 'INSERT' then
    event_name := 'created';
  elsif old.archived_at is null and new.archived_at is not null then
    event_name := 'archived';
  elsif old.archived_at is not null and new.archived_at is null then
    event_name := 'restored';
  elsif old.status is distinct from new.status then
    event_name := 'stage_changed';
  else
    return new;
  end if;

  insert into public.job_application_events (
    user_id,
    application_id,
    event_type,
    from_status,
    to_status
  )
  values (
    new.user_id,
    new.id,
    event_name,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status
  );

  return new;
end;
$job_tracker$;

drop trigger if exists log_job_application_event_trigger on public.job_applications;
create trigger log_job_application_event_trigger
  after insert or update of status, archived_at
  on public.job_applications
  for each row
  execute function public.log_job_application_event();

update public.job_applications as application
set
  listing_status = case when job.status = 'active' then 'active' else 'closed' end,
  listing_last_checked_at = coalesce(job.last_seen_at, job.updated_at),
  listing_closed_at = case
    when job.status = 'active' then null
    else coalesce(application.listing_closed_at, now())
  end
from public.jobs as job
where application.job_id = job.id;
