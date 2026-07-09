-- Reference data + starter template workouts, ported from
-- src/db/seed/sampleWorkouts.ts (FR-012). Idempotent (ON CONFLICT DO
-- NOTHING) so it's safe to re-run. Exercise ids/source_id are preserved from
-- the original local seed so future re-seeds or exercise-image-matching work
-- stay stable. Run via `supabase db reset` locally, or applied to the
-- hosted project the same way migrations are (see plan.md).

-- ---------------------------------------------------------------------------
-- muscle_groups
-- ---------------------------------------------------------------------------
insert into public.muscle_groups (id, name) values
  ('arms', 'arms'),
  ('back', 'back'),
  ('chest', 'chest'),
  ('core', 'core'),
  ('legs', 'legs'),
  ('shoulders', 'shoulders')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------
insert into public.exercises
  (id, name, muscle_group_id, equipment, image_url, instructions, is_warmup, source, source_id, license_author, license_url)
values
  ('bodyweight-squat', 'Bodyweight Squat', 'legs', 'bodyweight', 'assets/seed-exercises/placeholder.txt',
   'Stand tall, sit your hips back, bend your knees, then stand up with control.', true,
   'wger', 'seed-bodyweight-squat', 'wger exercise contributors', 'https://wger.de/'),
  ('incline-dumbbell-press', 'Incline Dumbbell Press', 'chest', 'dumbbell', 'assets/seed-exercises/placeholder.txt',
   'Perform compound warm-up sets. Choose bench angle that doesn''t stress shoulders. Neutral grip is optional. Retract shoulders throughout movement.', false,
   'wger', 'seed-incline-dumbbell-press', 'wger exercise contributors', 'https://wger.de/'),
  ('barbell-squat', 'Barbell Squat', 'legs', 'barbell', 'assets/seed-exercises/placeholder.txt',
   'Perform compound warm-up sets. Elevate heels if ankle mobility limits squat depth.', false,
   'wger', 'seed-barbell-squat', 'wger exercise contributors', 'https://wger.de/'),
  ('chest-supported-dumbbell-row', 'Chest Supported Dumbbell Row', 'back', 'dumbbell', 'assets/seed-exercises/placeholder.txt',
   'Retract shoulder blades during pull. Stretch fully at bottom. Avoid excessive biceps involvement. Last set: optional 3-5 partial reps after failure.', false,
   'wger', 'seed-chest-supported-dumbbell-row', 'wger exercise contributors', 'https://wger.de/'),
  ('seated-leg-curl', 'Seated Leg Curl', 'legs', 'machine', 'assets/seed-exercises/placeholder.txt',
   'Keep hips pressed into seat. Control the lowering phase. Squeeze hamstrings at top.', false,
   'wger', 'seed-seated-leg-curl', 'wger exercise contributors', 'https://wger.de/'),
  ('dumbbell-incline-curl', 'Dumbbell Incline Curl', 'arms', 'dumbbell', 'assets/seed-exercises/placeholder.txt',
   'Set bench to 45-60 degrees. Curl dumbbells toward shoulders, then lower slowly. Keep elbows stationary.', false,
   'wger', 'seed-dumbbell-incline-curl', 'wger exercise contributors', 'https://wger.de/'),
  ('dumbbell-overhead-triceps-extension', 'Dumbbell Overhead Triceps Extension', 'arms', 'dumbbell', 'assets/seed-exercises/placeholder.txt',
   'Hold one dumbbell with both hands overhead. Lower behind head, then extend arms upward. Keep elbows close to head.', false,
   'wger', 'seed-dumbbell-overhead-triceps-extension', 'wger exercise contributors', 'https://wger.de/'),
  ('behind-body-cable-curl', 'Behind-the-Body Cable Curl', 'arms', 'cable', 'assets/seed-exercises/placeholder.txt',
   'Stand facing away from cable machine. Curl handles toward shoulders, then lower with control.', false,
   'wger', 'seed-behind-body-cable-curl', 'wger exercise contributors', 'https://wger.de/'),
  ('rope-overhead-triceps-extension', 'Rope Overhead Triceps Extension', 'arms', 'cable', 'assets/seed-exercises/placeholder.txt',
   'Face away from cable machine. Hold rope overhead, extend arms, then return slowly. Keep elbows stationary.', false,
   'wger', 'seed-rope-overhead-triceps-extension', 'wger exercise contributors', 'https://wger.de/'),
  ('barbell-bench-press', 'Barbell Bench Press', 'chest', 'barbell', 'assets/seed-exercises/placeholder.txt',
   'Perform compound warm-up sets. Lower bar to mid-chest, then press upward. Keep feet flat on floor.', false,
   'wger', 'seed-barbell-bench-press', 'wger exercise contributors', 'https://wger.de/'),
  ('romanian-deadlift', 'Romanian Deadlift', 'legs', 'barbell', 'assets/seed-exercises/placeholder.txt',
   'Keep knees slightly bent. Hinge at hips, lower bar while keeping back straight, then return to standing.', false,
   'wger', 'seed-romanian-deadlift', 'wger exercise contributors', 'https://wger.de/'),
  ('lat-pulldown', 'Lat Pulldown', 'back', 'cable', 'assets/seed-exercises/placeholder.txt',
   'Pull bar down to upper chest. Lean back slightly. Control the return. Focus on lats.', false,
   'wger', 'seed-lat-pulldown', 'wger exercise contributors', 'https://wger.de/'),
  ('walking-lunges', 'Walking Lunges', 'legs', 'bodyweight', 'assets/seed-exercises/placeholder.txt',
   'Step forward, lower hips until both knees bend 90 degrees, then step forward with other leg. Keep torso upright.', false,
   'wger', 'seed-walking-lunges', 'wger exercise contributors', 'https://wger.de/'),
  ('behind-body-cable-lateral-raise', 'Behind-the-Body Cable Lateral Raise', 'shoulders', 'cable', 'assets/seed-exercises/placeholder.txt',
   'Stand facing away from cable. Raise arms to sides until parallel to floor. Control the lowering phase.', false,
   'wger', 'seed-behind-body-cable-lateral-raise', 'wger exercise contributors', 'https://wger.de/'),
  ('reverse-crunch', 'Reverse Crunch', 'core', 'bodyweight', 'assets/seed-exercises/placeholder.txt',
   'Lie on back, lift knees toward chest, curl hips off floor, then lower slowly. Keep lower back pressed to floor.', false,
   'wger', 'seed-reverse-crunch', 'wger exercise contributors', 'https://wger.de/'),
  ('seated-dumbbell-shoulder-press', 'Seated Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'assets/seed-exercises/placeholder.txt',
   'Dumbbells preferred over barbell. Bench slightly reclined. Press with elbows flared. Lower dumbbells beside shoulders.', false,
   'wger', 'seed-seated-dumbbell-shoulder-press', 'wger exercise contributors', 'https://wger.de/'),
  ('one-arm-dumbbell-row', 'One-Arm Dumbbell Row', 'back', 'dumbbell', 'assets/seed-exercises/placeholder.txt',
   'Pull elbow toward hip. Keep forearm vertical. Avoid torso rotation. Last set: optional partial reps after failure.', false,
   'wger', 'seed-one-arm-dumbbell-row', 'wger exercise contributors', 'https://wger.de/'),
  ('barbell-hip-thrust', 'Barbell Hip Thrust', 'legs', 'barbell', 'assets/seed-exercises/placeholder.txt',
   'Keep back neutral. Brace core. Squeeze glutes at top. Alternative: Dumbbell Step-Up.', false,
   'wger', 'seed-barbell-hip-thrust', 'wger exercise contributors', 'https://wger.de/'),
  ('dumbbell-step-up', 'Dumbbell Step-Up', 'legs', 'dumbbell', 'assets/seed-exercises/placeholder.txt',
   'Lean slightly forward and alternate legs. Step onto box, drive through heel to stand tall.', false,
   'wger', 'seed-dumbbell-step-up', 'wger exercise contributors', 'https://wger.de/'),
  ('leg-extension', 'Leg Extension', 'legs', 'machine', 'assets/seed-exercises/placeholder.txt',
   'Lean back if machine allows for greater rectus femoris stretch. Extend legs fully, then lower with control.', false,
   'wger', 'seed-leg-extension', 'wger exercise contributors', 'https://wger.de/'),
  ('seated-cable-chest-fly', 'Seated Cable Chest Fly', 'chest', 'cable', 'assets/seed-exercises/placeholder.txt',
   'Foam pad behind back increases chest stretch. Alternative: Pec Deck. Last set: optional partial reps after failure.', false,
   'wger', 'seed-seated-cable-chest-fly', 'wger exercise contributors', 'https://wger.de/'),
  ('standing-calf-raise', 'Standing Calf Raise', 'legs', 'machine', 'assets/seed-exercises/placeholder.txt',
   'Pause at bottom for stretch. Rise onto balls of feet, squeeze calves at top.', false,
   'wger', 'seed-standing-calf-raise', 'wger exercise contributors', 'https://wger.de/'),
  ('reverse-cable-fly', 'Reverse Cable Fly', 'shoulders', 'cable', 'assets/seed-exercises/placeholder.txt',
   'Cables slightly above shoulder height. Start with arms crossed for deeper stretch. Pull arms apart and back.', false,
   'wger', 'seed-reverse-cable-fly', 'wger exercise contributors', 'https://wger.de/')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- template workouts (is_template = true, user_id = null)
-- ---------------------------------------------------------------------------
insert into public.workouts (id, name, user_id, is_template, is_favourite) values
  ('workout-a', 'Full Body A', null, true, false),
  ('workout-b', 'Full Body B', null, true, false),
  ('workout-c', 'Full Body C', null, true, false)
on conflict (id) do nothing;

insert into public.workout_exercises
  (id, workout_id, exercise_id, order_index, target_sets, target_rep_range_low, target_rep_range_high, target_rest_seconds, target_weight)
values
  ('we-workout-a-0', 'workout-a', 'bodyweight-squat', 0, 2, 10, 15, 45, null),
  ('we-workout-a-1', 'workout-a', 'incline-dumbbell-press', 1, 3, 8, 12, 90, 12),
  ('we-workout-a-2', 'workout-a', 'barbell-squat', 2, 3, 6, 8, 120, 40),
  ('we-workout-a-3', 'workout-a', 'chest-supported-dumbbell-row', 3, 3, 8, 10, 90, 14),
  ('we-workout-a-4', 'workout-a', 'seated-leg-curl', 4, 3, 10, 15, 60, 25),
  ('we-workout-a-5', 'workout-a', 'dumbbell-incline-curl', 5, 3, 10, 15, 45, 8),
  ('we-workout-a-6', 'workout-a', 'dumbbell-overhead-triceps-extension', 6, 3, 10, 15, 45, 10),

  ('we-workout-b-0', 'workout-b', 'barbell-bench-press', 0, 3, 6, 8, 120, 40),
  ('we-workout-b-1', 'workout-b', 'romanian-deadlift', 1, 3, 8, 10, 90, 50),
  ('we-workout-b-2', 'workout-b', 'lat-pulldown', 2, 3, 8, 12, 90, 35),
  ('we-workout-b-3', 'workout-b', 'walking-lunges', 3, 3, 10, 12, 60, null),
  ('we-workout-b-4', 'workout-b', 'behind-body-cable-lateral-raise', 4, 3, 12, 15, 45, 5),
  ('we-workout-b-5', 'workout-b', 'reverse-crunch', 5, 3, 12, 15, 45, null),

  ('we-workout-c-0', 'workout-c', 'seated-dumbbell-shoulder-press', 0, 3, 8, 12, 90, 10),
  ('we-workout-c-1', 'workout-c', 'one-arm-dumbbell-row', 1, 3, 8, 12, 90, 14),
  ('we-workout-c-2', 'workout-c', 'barbell-hip-thrust', 2, 3, 10, 15, 90, 40),
  ('we-workout-c-3', 'workout-c', 'leg-extension', 3, 3, 10, 15, 60, 25),
  ('we-workout-c-4', 'workout-c', 'seated-cable-chest-fly', 4, 3, 10, 15, 60, 15),
  ('we-workout-c-5', 'workout-c', 'standing-calf-raise', 5, 3, 10, 15, 45, 30),
  ('we-workout-c-6', 'workout-c', 'reverse-cable-fly', 6, 3, 10, 15, 45, 5)
on conflict (id) do nothing;

-- Derives a uniform per-set plan (every set carrying the same reps/weight)
-- from each workout_exercise's summary fields, mirroring
-- workoutRepository.ts's derivedUniformPlan().
insert into public.workout_exercise_set_plans (id, workout_exercise_id, set_number, reps, weight)
select we.id || '-set-' || gs.set_number,
       we.id,
       gs.set_number,
       we.target_rep_range_low,
       we.target_weight
  from public.workout_exercises we
  cross join lateral generate_series(1, we.target_sets) as gs(set_number)
 where we.workout_id in ('workout-a', 'workout-b', 'workout-c')
on conflict (id) do nothing;
