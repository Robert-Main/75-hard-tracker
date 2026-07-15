-- Workout preference list for quick-picks on Today
alter table public.hard75_reminder_settings
  add column if not exists workout_prefs jsonb not null default '[]'::jsonb;
