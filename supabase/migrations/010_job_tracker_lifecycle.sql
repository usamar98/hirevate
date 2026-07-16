alter table public.job_applications
  drop constraint if exists job_applications_status_check;

alter table public.job_applications
  add constraint job_applications_status_check check (
    status in (
      'interested',
      'applied',
      'screening',
      'interview',
      'assessment',
      'final_interview',
      'offer',
      'accepted',
      'rejected',
      'withdrawn'
    )
  );

alter table public.job_applications
  add column if not exists priority text default 'medium' not null
    check (priority in ('low', 'medium', 'high')),
  add column if not exists next_action text,
  add column if not exists listing_status text default 'unknown' not null
    check (listing_status in ('active', 'closed', 'unavailable', 'unknown')),
  add column if not exists listing_last_checked_at timestamp with time zone,
  add column if not exists listing_closed_at timestamp with time zone,
  add column if not exists status_changed_at timestamp with time zone default now() not null,
  add column if not exists archived_at timestamp with time zone;

create index if not exists job_applications_user_active_idx
  on public.job_applications(user_id, updated_at desc)
  where archived_at is null;

create index if not exists job_applications_user_listing_status_idx
  on public.job_applications(user_id, listing_status, updated_at desc);

create table if not exists public.job_application_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  application_id uuid references public.job_applications(id) on delete cascade not null,
  event_type text not null check (event_type in ('created', 'stage_changed', 'archived', 'restored')),
  from_status text,
  to_status text,
  created_at timestamp with time zone default now() not null
);

create index if not exists job_application_events_user_created_idx
  on public.job_application_events(user_id, created_at desc);

create index if not exists job_application_events_application_created_idx
  on public.job_application_events(application_id, created_at desc);

alter table public.job_application_events enable row level security;

drop policy if exists "Users can read own job application events" on public.job_application_events;
create policy "Users can read own job application events"
  on public.job_application_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.job_application_events to authenticated;

create or replace function public.set_job_application_listing_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_status text;
  source_checked_at timestamp with time zone;
begin
  if new.job_id is null then
    new.listing_status := coalesce(new.listing_status, 'unknown');
    return new;
  end if;

  select status, coalesce(last_seen_at, updated_at)
  into source_status, source_checked_at
  from public.jobs
  where id = new.job_id;

  if not found then
    new.listing_status := 'unavailable';
    new.listing_last_checked_at := now();
    new.listing_closed_at := coalesce(new.listing_closed_at, now());
    return new;
  end if;

  new.listing_status := case when source_status = 'active' then 'active' else 'closed' end;
  new.listing_last_checked_at := source_checked_at;
  new.listing_closed_at := case
    when source_status = 'active' then null
    else coalesce(new.listing_closed_at, now())
  end;

  return new;
end;
$$;

drop trigger if exists set_job_application_listing_state_trigger on public.job_applications;
create trigger set_job_application_listing_state_trigger
  before insert or update of job_id
  on public.job_applications
  for each row
  execute function public.set_job_application_listing_state();

create or replace function public.sync_tracked_job_listing_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_applications
  set
    listing_status = case when new.status = 'active' then 'active' else 'closed' end,
    listing_last_checked_at = coalesce(new.last_seen_at, new.updated_at, now()),
    listing_closed_at = case
      when new.status = 'active' then null
      else coalesce(listing_closed_at, now())
    end,
    updated_at = updated_at
  where job_id = new.id;

  return new;
end;
$$;

drop trigger if exists sync_tracked_job_listing_state_trigger on public.jobs;
create trigger sync_tracked_job_listing_state_trigger
  after update of status, last_seen_at
  on public.jobs
  for each row
  execute function public.sync_tracked_job_listing_state();

create or replace function public.set_job_application_status_changed_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

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
as $$
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
$$;

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
