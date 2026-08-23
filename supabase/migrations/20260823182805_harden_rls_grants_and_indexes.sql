-- Restore the intended public/job-owner policies in environments where the
-- initial schema was created outside the recorded migration history.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own editable profile fields" on public.profiles;
create policy "Users can update own editable profile fields"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Public can read active jobs" on public.jobs;
create policy "Public can read active jobs"
  on public.jobs for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Users can read own saved jobs" on public.saved_jobs;
create policy "Users can read own saved jobs"
  on public.saved_jobs for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can save own jobs" on public.saved_jobs;
create policy "Users can save own jobs"
  on public.saved_jobs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own saved jobs" on public.saved_jobs;
create policy "Users can delete own saved jobs"
  on public.saved_jobs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own job views" on public.job_views;
create policy "Users can read own job views"
  on public.job_views for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own job views" on public.job_views;
create policy "Users can insert own job views"
  on public.job_views for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Remove broad default grants, then add only the operations used by the app.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, email, full_name, username, country_code, country_name)
  on public.profiles to authenticated;
grant update (full_name, username, country_code, country_name)
  on public.profiles to authenticated;

revoke all on public.companies from anon, authenticated;
grant select on public.companies to anon, authenticated;

revoke all on public.jobs from anon, authenticated;
grant select on public.jobs to anon, authenticated;

revoke all on public.saved_jobs from anon, authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;

revoke all on public.job_views from anon, authenticated;
grant select, insert on public.job_views to authenticated;

revoke all on public.job_applications from anon, authenticated;
grant select, insert, update, delete on public.job_applications to authenticated;

revoke all on public.job_application_events from anon, authenticated;
grant select on public.job_application_events to authenticated;

revoke all on public.resume_ab_tests from anon, authenticated;
grant select, insert, update, delete on public.resume_ab_tests to authenticated;

revoke all on public.resume_ab_applications from anon, authenticated;
grant select, insert, update, delete on public.resume_ab_applications to authenticated;

revoke all on public.trial_feature_usage from anon, authenticated;
revoke all on public.daily_visitors from anon, authenticated;
revoke all on public.job_source_health from anon, authenticated;
revoke all on public.job_source_usage from anon, authenticated;

-- Cover foreign-key lookups used when jobs are updated or removed.
create index if not exists job_applications_job_id_idx
  on public.job_applications(job_id)
  where job_id is not null;

create index if not exists job_views_job_id_idx
  on public.job_views(job_id)
  where job_id is not null;

create index if not exists saved_jobs_job_id_idx
  on public.saved_jobs(job_id)
  where job_id is not null;

-- Supabase recommends keeping extensions out of the exposed public schema.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
