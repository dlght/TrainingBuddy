-- Spec 007: sample-workout favourites (per-account, since template workouts
-- are shared rows and workouts.is_favourite can't represent "favourited by
-- account X" without leaking to every other account) and the challenge badge
-- catalog (global reference data, same shape as exercises/muscle_groups).

-- ---------------------------------------------------------------------------
-- sample_workout_favourites
-- ---------------------------------------------------------------------------
create table public.sample_workout_favourites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_id text not null references public.workouts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, workout_id)
);

alter table public.sample_workout_favourites enable row level security;

create policy "sample_workout_favourites_all_own" on public.sample_workout_favourites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------------
-- Static catalog only — achievement itself is computed live from each
-- account's own history (lifetime completed-session count, longest-ever
-- streak), not stored per-user. Both are monotonically non-decreasing, so
-- there is nothing to backfill or un-achieve.
create table public.badges (
  id text primary key,
  category text not null check (category in ('lifetime_workouts', 'streak')),
  threshold integer not null check (threshold > 0),
  label text not null check (length(trim(label)) > 0),
  unique (category, threshold)
);

alter table public.badges enable row level security;

create policy "badges_select_all" on public.badges
  for select to authenticated
  using (true);
