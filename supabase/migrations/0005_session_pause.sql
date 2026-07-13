-- Spec 009: pausing an active session when the user navigates away from the
-- session screen without an explicit end/discard action, so elapsed/rest
-- time isn't silently counted while the app is unattended.

alter table public.workout_sessions
  drop constraint if exists workout_sessions_status_check;

alter table public.workout_sessions
  add constraint workout_sessions_status_check
  check (status in ('active', 'paused', 'completed', 'discarded'));

alter table public.workout_sessions
  add column paused_at timestamptz;
