create table if not exists public.resume_ab_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  resume_a_name text default 'Resume A' not null,
  resume_a_notes text,
  resume_b_name text default 'Resume B' not null,
  resume_b_notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.resume_ab_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ab_test_id uuid references public.resume_ab_tests(id) on delete cascade not null,
  resume_variant text not null check (resume_variant in ('A', 'B')),
  job_title text not null,
  company text,
  contact_name text,
  contact_email text,
  status text default 'applied' not null check (status in ('applied', 'interview', 'offer', 'rejected')),
  application_channel text default 'direct' not null check (application_channel in ('direct', 'referral', 'recruiter', 'job_board', 'other')),
  applied_at date default current_date not null,
  interview_at date,
  next_follow_up_at date,
  source_url text,
  resume_snapshot_url text,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists resume_ab_tests_user_created_idx
  on public.resume_ab_tests(user_id, created_at desc);

create index if not exists resume_ab_applications_user_created_idx
  on public.resume_ab_applications(user_id, created_at desc);

create index if not exists resume_ab_applications_test_variant_idx
  on public.resume_ab_applications(ab_test_id, resume_variant);

create index if not exists resume_ab_applications_user_status_idx
  on public.resume_ab_applications(user_id, status);

create index if not exists resume_ab_applications_user_job_title_idx
  on public.resume_ab_applications(user_id, lower(job_title));

create index if not exists resume_ab_applications_user_followup_idx
  on public.resume_ab_applications(user_id, next_follow_up_at)
  where status = 'applied';

alter table public.resume_ab_tests enable row level security;
alter table public.resume_ab_applications enable row level security;

drop policy if exists "Users can manage own resume tests" on public.resume_ab_tests;
create policy "Users can manage own resume tests"
  on public.resume_ab_tests for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own resume test applications" on public.resume_ab_applications;
create policy "Users can manage own resume test applications"
  on public.resume_ab_applications for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.resume_ab_tests to authenticated;
grant select, insert, update, delete on public.resume_ab_applications to authenticated;
