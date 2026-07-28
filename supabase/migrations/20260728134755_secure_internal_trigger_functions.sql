drop function if exists public.handle_new_user();

revoke all on function public.log_job_application_event()
from public, anon, authenticated;

revoke all on function public.set_job_application_listing_state()
from public, anon, authenticated;

revoke all on function public.sync_tracked_job_listing_state()
from public, anon, authenticated;

revoke all on function public.reserve_job_source_searches(text, integer, integer)
from public, anon, authenticated;

grant execute on function public.reserve_job_source_searches(text, integer, integer)
to service_role;
