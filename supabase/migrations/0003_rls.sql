-- Row Level Security: the only authorization layer (FR-007/FR-008). Every
-- user-owned table is scoped to auth.uid(); reference data is public-read
-- with no client write policy (writes only via a service-role seed script).

alter table public.profiles enable row level security;
alter table public.muscle_groups enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_exercise_set_plans enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: a user can only see/change their own row
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- muscle_groups / exercises: shared reference data, read-only for clients
-- ---------------------------------------------------------------------------
create policy "muscle_groups_select_all" on public.muscle_groups
  for select to authenticated
  using (true);

create policy "exercises_select_all" on public.exercises
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- workouts: own rows, plus shared read-only templates (user_id is null)
-- ---------------------------------------------------------------------------
create policy "workouts_select_own_or_template" on public.workouts
  for select to authenticated
  using (user_id = auth.uid() or is_template);

create policy "workouts_insert_own" on public.workouts
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "workouts_update_own" on public.workouts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "workouts_delete_own" on public.workouts
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- workout_exercises / workout_exercise_set_plans: scoped through the parent
-- workout's owner (or template visibility for reads)
-- ---------------------------------------------------------------------------
create policy "workout_exercises_select" on public.workout_exercises
  for select to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id
        and (w.user_id = auth.uid() or w.is_template)
    )
  );

create policy "workout_exercises_write" on public.workout_exercises
  for all to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

create policy "workout_exercise_set_plans_select" on public.workout_exercise_set_plans
  for select to authenticated
  using (
    exists (
      select 1
        from public.workout_exercises we
        join public.workouts w on w.id = we.workout_id
       where we.id = workout_exercise_set_plans.workout_exercise_id
         and (w.user_id = auth.uid() or w.is_template)
    )
  );

create policy "workout_exercise_set_plans_write" on public.workout_exercise_set_plans
  for all to authenticated
  using (
    exists (
      select 1
        from public.workout_exercises we
        join public.workouts w on w.id = we.workout_id
       where we.id = workout_exercise_set_plans.workout_exercise_id
         and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
        from public.workout_exercises we
        join public.workouts w on w.id = we.workout_id
       where we.id = workout_exercise_set_plans.workout_exercise_id
         and w.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- workout_sessions: own rows only, no template concept
-- ---------------------------------------------------------------------------
create policy "workout_sessions_all_own" on public.workout_sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- set_logs: scoped through the parent session's owner
-- ---------------------------------------------------------------------------
create policy "set_logs_all_own" on public.set_logs
  for all to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = set_logs.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = set_logs.session_id and s.user_id = auth.uid()
    )
  );
