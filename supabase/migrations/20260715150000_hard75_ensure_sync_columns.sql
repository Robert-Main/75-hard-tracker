-- Ensure all 75 Hard sync columns exist (safe to re-run)

alter table public.hard75_reminder_settings
  add column if not exists workout_prefs jsonb not null default '[]'::jsonb;

alter table public.hard75_reminder_settings
  add column if not exists task_settings jsonb not null default '{}'::jsonb;

alter table public.hard75_day_logs
  add column if not exists custom_tasks jsonb not null default '{}'::jsonb;
