-- Keep the welcome automation idempotent across confirmation retries and later logins.
alter table public.profiles
  add column if not exists welcome_email_triggered_at timestamptz;

comment on column public.profiles.welcome_email_triggered_at is
  'Server-owned timestamp set when the Resend new-user welcome event is accepted.';

-- Existing accounts predate this automation and should not receive a delayed welcome email.
update public.profiles
set welcome_email_triggered_at = created_at
where welcome_email_triggered_at is null;
