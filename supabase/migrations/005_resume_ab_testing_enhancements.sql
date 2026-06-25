alter table if exists public.resume_ab_applications
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists application_channel text default 'direct' not null,
  add column if not exists next_follow_up_at date,
  add column if not exists resume_snapshot_url text;

do $$
begin
  if to_regclass('public.resume_ab_applications') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'resume_ab_applications_application_channel_check'
     ) then
    alter table public.resume_ab_applications
      add constraint resume_ab_applications_application_channel_check
      check (application_channel in ('direct', 'referral', 'recruiter', 'job_board', 'other'));
  end if;
end $$;

do $$
begin
  if to_regclass('public.resume_ab_applications') is not null then
    create index if not exists resume_ab_applications_user_followup_idx
      on public.resume_ab_applications(user_id, next_follow_up_at)
      where status = 'applied';
  end if;
end $$;
