-- 75 Hard challenge tracker

create table if not exists public.hard75_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at date not null,
  status text not null check (status in ('active', 'failed', 'completed')),
  failed_at date,
  completed_at date,
  created_at timestamptz not null default now()
);

create index if not exists hard75_challenges_user_id_idx
  on public.hard75_challenges (user_id);

create index if not exists hard75_challenges_user_active_idx
  on public.hard75_challenges (user_id)
  where status = 'active';

create table if not exists public.hard75_day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.hard75_challenges (id) on delete cascade,
  day_index int not null check (day_index between 1 and 75),
  log_date date not null,
  workout1 jsonb not null default '{"done":false,"location":null,"note":"","durationMins":null}'::jsonb,
  workout2 jsonb not null default '{"done":false,"location":null,"note":"","durationMins":null}'::jsonb,
  diet boolean not null default false,
  water_oz int not null default 0 check (water_oz >= 0),
  reading_pages int not null default 0 check (reading_pages >= 0),
  reading_title text not null default '',
  has_photo boolean not null default false,
  photo_path text,
  updated_at timestamptz not null default now(),
  unique (challenge_id, day_index)
);

create index if not exists hard75_day_logs_user_id_idx
  on public.hard75_day_logs (user_id);

create index if not exists hard75_day_logs_challenge_id_idx
  on public.hard75_day_logs (challenge_id);

create table if not exists public.hard75_reminder_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  fired_keys text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);

alter table public.hard75_challenges enable row level security;
alter table public.hard75_day_logs enable row level security;
alter table public.hard75_reminder_settings enable row level security;

create policy "hard75_challenges_select_own"
  on public.hard75_challenges for select
  to authenticated
  using (auth.uid() = user_id);

create policy "hard75_challenges_insert_own"
  on public.hard75_challenges for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "hard75_challenges_update_own"
  on public.hard75_challenges for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "hard75_challenges_delete_own"
  on public.hard75_challenges for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "hard75_day_logs_select_own"
  on public.hard75_day_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "hard75_day_logs_insert_own"
  on public.hard75_day_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "hard75_day_logs_update_own"
  on public.hard75_day_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "hard75_day_logs_delete_own"
  on public.hard75_day_logs for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "hard75_reminders_select_own"
  on public.hard75_reminder_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "hard75_reminders_insert_own"
  on public.hard75_reminder_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "hard75_reminders_update_own"
  on public.hard75_reminder_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "hard75_reminders_delete_own"
  on public.hard75_reminder_settings for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hard75-photos',
  'hard75-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "hard75_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'hard75-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hard75_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'hard75-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hard75_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'hard75-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'hard75-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hard75_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'hard75-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
