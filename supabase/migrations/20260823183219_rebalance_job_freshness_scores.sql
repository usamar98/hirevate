-- Keep freshness sector-neutral. The previous score gave software-related job
-- titles an unrelated bonus, which disadvantaged healthcare, operations,
-- finance and other roles even when their source evidence was equally recent.
update public.jobs
set freshness_score = least(
  100,
  40
  + case
      when coalesce(updated_at, posted_at, discovered_at) >= statement_timestamp() - interval '1 day' then 40
      when coalesce(updated_at, posted_at, discovered_at) >= statement_timestamp() - interval '3 days' then 30
      when coalesce(updated_at, posted_at, discovered_at) >= statement_timestamp() - interval '7 days' then 20
      when coalesce(updated_at, posted_at, discovered_at) >= statement_timestamp() - interval '14 days' then 10
      else 0
    end
  + case when nullif(btrim(location), '') is not null then 10 else 0 end
  + case when apply_url is not null or source_url is not null then 10 else 0 end
);
