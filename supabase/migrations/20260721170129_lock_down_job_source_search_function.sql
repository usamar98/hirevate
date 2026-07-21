-- New Supabase projects can grant function execution directly to API roles.
-- Keep this quota-mutating function backend-only, independent of defaults.
revoke all on function public.reserve_job_source_searches(text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.reserve_job_source_searches(text, integer, integer)
  to service_role;
