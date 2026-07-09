-- Initial Postgres schema for TrainingBuddy, translated from src/db/schema.ts
-- (the SQLite/Drizzle schema, retired by spec 006).
--
-- Id strategy: content rows (workouts, workout_exercises, set plans, sessions,
-- set logs, exercises, muscle groups) keep app-generated TEXT ids, matching
-- today's client-side createLocalId()/seed ids, to minimize app-side churn.
-- Only `profiles.id` and the `user_id` FK columns are UUID, since they must
-- line up with Supabase Auth's auth.users.id.
--
-- `seed_versions` is dropped: reference-data seeding is now a deploy-time act
-- (supabase/seed.sql) rather than a runtime app self-heal check.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Replaces the old local-only `users` table. A row is created automatically
-- by the trigger in 0002_profiles_signup_trigger.sql when someone signs up,
-- with the identity/preference fields left NULL until the profile-setup
-- screen fills them in — unlike the old schema, these can't be required NOT
-- NULL at signup time since nothing has asked the user for them yet.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  bodyweight numeric check (bodyweight is null or bodyweight > 0),
  height numeric check (height is null or height > 0),
  weight_unit text check (weight_unit is null or weight_unit in ('kg', 'lb')),
  experience_level text check (
    experience_level is null
    or experience_level in ('new', 'some_experience', 'returning')
  ),
  goal text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- muscle_groups
-- ---------------------------------------------------------------------------
create table public.muscle_groups (
  id text primary key,
  name text not null unique check (
    name in ('chest', 'back', 'legs', 'shoulders', 'arms', 'core')
  )
);

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------
create table public.exercises (
  id text primary key,
  name text not null unique check (length(trim(name)) > 0),
  muscle_group_id text not null references public.muscle_groups (id) on delete restrict,
  equipment text,
  image_url text not null check (length(trim(image_url)) > 0),
  instructions text not null check (length(trim(instructions)) > 0),
  is_warmup boolean not null default false,
  video_url text,
  source text,
  source_id text,
  license_author text,
  license_url text
);

create index exercises_muscle_group_idx on public.exercises (muscle_group_id);
create index exercises_source_idx on public.exercises (source, source_id);

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table public.workouts (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  user_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  is_template boolean not null default false,
  source_template_id text references public.workouts (id) on delete set null,
  is_favourite boolean not null default false,
  check ((is_template and user_id is null) or not is_template)
);

create index workouts_user_idx on public.workouts (user_id);
create index workouts_template_idx on public.workouts (is_template);
create index workouts_source_template_idx on public.workouts (source_template_id);
create index workouts_favourite_idx on public.workouts (is_favourite);

-- ---------------------------------------------------------------------------
-- workout_exercises
-- ---------------------------------------------------------------------------
create table public.workout_exercises (
  id text primary key,
  workout_id text not null references public.workouts (id) on delete cascade,
  exercise_id text not null references public.exercises (id) on delete restrict,
  order_index integer not null check (order_index >= 0),
  target_sets integer not null check (target_sets > 0),
  target_rep_range_low integer not null check (target_rep_range_low > 0),
  target_rep_range_high integer not null check (target_rep_range_high >= target_rep_range_low),
  target_rest_seconds integer not null check (target_rest_seconds >= 0),
  target_weight numeric,
  superset_group_id text,
  unique (workout_id, order_index)
);

create index workout_exercises_workout_idx on public.workout_exercises (workout_id);
create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- workout_exercise_set_plans
-- ---------------------------------------------------------------------------
create table public.workout_exercise_set_plans (
  id text primary key,
  workout_exercise_id text not null references public.workout_exercises (id) on delete cascade,
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps > 0),
  weight numeric,
  unique (workout_exercise_id, set_number)
);

create index workout_exercise_set_plans_workout_exercise_idx
  on public.workout_exercise_set_plans (workout_exercise_id);

-- ---------------------------------------------------------------------------
-- workout_sessions
-- ---------------------------------------------------------------------------
create table public.workout_sessions (
  id text primary key,
  workout_id text not null references public.workouts (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null check (status in ('active', 'completed', 'discarded')),
  workout_name_snapshot text not null check (length(trim(workout_name_snapshot)) > 0),
  -- No range CHECK, matching schema.ts: 1-5 is validated in application code.
  rating integer
);

create index workout_sessions_user_status_idx on public.workout_sessions (user_id, status);
create index workout_sessions_workout_idx on public.workout_sessions (workout_id);

-- ---------------------------------------------------------------------------
-- set_logs
-- ---------------------------------------------------------------------------
create table public.set_logs (
  id text primary key,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  workout_exercise_id text not null references public.workout_exercises (id) on delete restrict,
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps >= 0),
  -- Nullable: bodyweight-exercise sets carry no logged weight.
  weight numeric check (weight is null or weight >= 0),
  completed_at timestamptz not null,
  exercise_name_snapshot text not null check (length(trim(exercise_name_snapshot)) > 0),
  target_reps_snapshot text,
  target_rest_seconds_snapshot integer check (
    target_rest_seconds_snapshot is null or target_rest_seconds_snapshot >= 0
  )
);

create index set_logs_session_idx on public.set_logs (session_id);
create index set_logs_workout_exercise_idx on public.set_logs (workout_exercise_id);
