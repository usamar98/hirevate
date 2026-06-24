-- Run in Supabase Dashboard -> SQL Editor.
-- Replace this email with the account that should access /admin/users and /admin/jobs-sync.

update public.profiles
set role = 'admin'
where lower(email) = lower('you@example.com');

select id, email, role
from public.profiles
where lower(email) = lower('you@example.com');
