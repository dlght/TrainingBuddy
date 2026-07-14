-- Spec 010 (US4/US5): personal-record tracking. A row is written once per
-- exercise per session, only when that session's best set for the exercise
-- beats every prior recorded best (see plan.md Design Decisions 1-3) — rows
-- are never updated or deleted when superseded, so "current best" is
-- MAX(weight) grouped by exercise, and "PR count" is a plain row count.

create table public.personal_records (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id text not null references public.exercises (id),
  weight numeric not null check (weight > 0),
  reps integer not null check (reps > 0),
  session_id text not null references public.workout_sessions (id) on delete cascade,
  achieved_at timestamptz not null default now()
);

alter table public.personal_records enable row level security;

create policy "personal_records_all_own" on public.personal_records
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index personal_records_user_exercise_idx on public.personal_records (user_id, exercise_id);

-- Widen the badges category constraint (0007 covered the first three new
-- categories; these two depend on personal_records existing, hence deferred
-- here).
alter table public.badges
  drop constraint badges_category_check;

alter table public.badges
  add constraint badges_category_check check (
    category in (
      'lifetime_workouts',
      'streak',
      'total_volume_kg',
      'monthly_workout_count',
      'exercise_session_count',
      'pr_count',
      'bodyweight_ratio'
    )
  );

-- New exercise: the curated library had Romanian/sumo/kettlebell/single-leg
-- deadlift variants but no conventional barbell deadlift, which "Deadlift
-- 2x bodyweight" needs (see spec.md Assumptions). Real photo from wger's
-- "Deadlifts" (exercise 184, category Back, equipment Barbell).
insert into public.exercises
  (id, name, muscle_group_id, equipment, image_url, instructions, is_warmup, source, source_id, license_author, license_url)
values
  ('barbell-deadlift', 'Barbell Deadlift', 'legs', 'barbell',
   'https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg',
   'Keep your back neutral and core braced. Hinge at the hips, grip the bar just outside your legs, then drive through your heels to stand tall. Lower with control.', false,
   'wger', 'seed-barbell-deadlift', 'philip', '')
on conflict (id) do nothing;

insert into public.badges (id, category, threshold, label) values
  ('first-pr', 'pr_count', 1, 'First PR'),
  ('pr-50', 'pr_count', 50, '50 PRs')
on conflict (id) do nothing;

-- `threshold` is unused (always 1) for bodyweight_ratio: achievement is a
-- boolean best-weight-vs-bodyweight*multiplier comparison, not a count.
insert into public.badges (id, category, threshold, label, exercise_id, ratio_multiplier) values
  ('bench-bodyweight', 'bodyweight_ratio', 1, 'Bench bodyweight', 'barbell-bench-press', 1.0),
  ('squat-1-5x-bodyweight', 'bodyweight_ratio', 1, 'Squat 1.5x bodyweight', 'barbell-squat', 1.5),
  ('deadlift-2x-bodyweight', 'bodyweight_ratio', 1, 'Deadlift 2x bodyweight', 'barbell-deadlift', 2.0)
on conflict (id) do nothing;
