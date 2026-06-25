create table if not exists public.job_source_usage (
  source text not null,
  period_month date not null,
  searches_used integer default 0 not null check (searches_used >= 0),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  primary key (source, period_month)
);

alter table public.job_source_usage enable row level security;

create or replace function public.reserve_job_source_searches(
  source_name text,
  monthly_limit integer,
  reserve_count integer default 1
)
returns table(allowed boolean, searches_used integer, searches_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month date := date_trunc('month', now())::date;
  current_used integer;
begin
  if monthly_limit <= 0 or reserve_count <= 0 then
    return query select false, 0, greatest(monthly_limit, 0);
    return;
  end if;

  insert into public.job_source_usage (source, period_month, searches_used)
  values (source_name, current_month, 0)
  on conflict (source, period_month) do nothing;

  select job_source_usage.searches_used
  into current_used
  from public.job_source_usage
  where job_source_usage.source = source_name
    and job_source_usage.period_month = current_month
  for update;

  if current_used + reserve_count > monthly_limit then
    return query select false, current_used, greatest(monthly_limit - current_used, 0);
    return;
  end if;

  update public.job_source_usage
  set searches_used = current_used + reserve_count,
      updated_at = now()
  where job_source_usage.source = source_name
    and job_source_usage.period_month = current_month
  returning job_source_usage.searches_used into current_used;

  return query select true, current_used, greatest(monthly_limit - current_used, 0);
end;
$$;

revoke all on function public.reserve_job_source_searches(text, integer, integer) from public;
grant execute on function public.reserve_job_source_searches(text, integer, integer) to service_role;
