-- Missed source refreshes are not proof that a job has closed. Disable only
-- Hirevate's legacy destructive cron; leave unrelated schedules untouched.
-- The application now retains confirmed-expired records for at least 30 days.
-- No rows are deleted or reactivated by this migration.
do $$
declare
  retention_job_id bigint;
begin
  if to_regclass('cron.job') is not null then
    for retention_job_id in
      select jobid from cron.job
      where jobname = 'hirevate-delete-jobs-older-than-10-days'
    loop
      perform cron.unschedule(retention_job_id);
    end loop;
  end if;
end;
$$;
