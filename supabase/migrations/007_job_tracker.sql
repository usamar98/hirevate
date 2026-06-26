create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete set null,
  job_title text not null,
  company text not null,
  location text,
  job_url text,
  status text default 'interested' not null check (
    status in ('interested', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')
  ),
  contact_name text,
  contact_email text,
  salary_range text,
  applied_at date,
  next_follow_up_at date,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists job_applications_user_created_idx
  on public.job_applications(user_id, created_at desc);

create index if not exists job_applications_user_status_idx
  on public.job_applications(user_id, status, updated_at desc);

create index if not exists job_applications_user_followup_idx
  on public.job_applications(user_id, next_follow_up_at)
  where next_follow_up_at is not null and status in ('interested', 'applied', 'interview');

create unique index if not exists job_applications_user_job_unique_idx
  on public.job_applications(user_id, job_id)
  where job_id is not null;

alter table public.job_applications enable row level security;

drop policy if exists "Users can manage own job applications" on public.job_applications;
create policy "Users can manage own job applications"
  on public.job_applications for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.job_applications to authenticated;
