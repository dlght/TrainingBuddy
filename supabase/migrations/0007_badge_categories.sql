-- Spec 010: widen the badges catalog beyond the two categories spec 007
-- shipped with (see 0004_polish_and_challenges.sql's comment — that spec
-- deliberately kept this narrow and non-extensible). Adds three new
-- account-wide/exercise-scoped categories. PR-count and bodyweight-ratio
-- categories are deferred to 0008_personal_records.sql, which also
-- introduces the personal_records table those two depend on.

alter table public.badges
  drop constraint badges_category_check;

alter table public.badges
  add constraint badges_category_check check (
    category in (
      'lifetime_workouts',
      'streak',
      'total_volume_kg',
      'monthly_workout_count',
      'exercise_session_count'
    )
  );

alter table public.badges
  add column exercise_id text references public.exercises (id),
  add column ratio_multiplier numeric check (ratio_multiplier is null or ratio_multiplier > 0);

-- Naively widening the old `unique (category, threshold)` constraint to
-- `unique (category, threshold, exercise_id)` would silently weaken
-- uniqueness for every existing row, since Postgres treats NULL <> NULL in
-- unique constraints. Two partial unique indexes instead: one preserves
-- spec 007's original guarantee for the account-wide categories, the other
-- covers the new exercise-scoped ones.
alter table public.badges
  drop constraint badges_category_threshold_key;

create unique index badges_no_exercise_uq on public.badges (category, threshold)
  where exercise_id is null;

create unique index badges_with_exercise_uq on public.badges (category, threshold, exercise_id)
  where exercise_id is not null;

insert into public.badges (id, category, threshold, label) values
  ('first-workout', 'lifetime_workouts', 1, 'First workout'),
  ('streak-365', 'streak', 365, '365 day streak'),
  ('monthly-10', 'monthly_workout_count', 10, '10 workouts in a month'),
  ('volume-10000', 'total_volume_kg', 10000, '10,000kg lifted'),
  ('volume-1000000', 'total_volume_kg', 1000000, '1 million kg lifetime')
on conflict (id) do nothing;

insert into public.badges (id, category, threshold, label, exercise_id) values
  ('bench-sessions-100', 'exercise_session_count', 100, '100 bench sessions', 'barbell-bench-press')
on conflict (id) do nothing;
