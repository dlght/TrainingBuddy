import type { FakeStore } from "./fakeSupabase";

export const TEST_USER_ID = "u1";

/**
 * A minimal but complete fake-store fixture: one profile, one muscle group,
 * one exercise, and one template workout ("workout-a" / "Full Body A") with
 * a single "bodyweight-squat" exercise — enough for most session/workout
 * tests. Extend the returned store's arrays directly for scenario-specific
 * rows (a second exercise, a logged session, etc).
 */
export function baseSeed(): FakeStore {
  return {
    profiles: [
      {
        id: TEST_USER_ID,
        name: "Alex",
        bodyweight: 75,
        height: null,
        weight_unit: "kg",
        experience_level: "new",
        goal: "Build consistency",
        created_at: "2026-01-01T00:00:00.000Z"
      }
    ],
    muscle_groups: [{ id: "legs", name: "legs" }],
    exercises: [
      {
        id: "bodyweight-squat",
        name: "Bodyweight Squat",
        muscle_group_id: "legs",
        equipment: "bodyweight",
        image_url: "assets/seed-exercises/placeholder.txt",
        instructions: "Squat.",
        is_warmup: true,
        video_url: null,
        source: "wger",
        source_id: "seed-bodyweight-squat",
        license_author: null,
        license_url: null
      }
    ],
    workouts: [
      {
        id: "workout-a",
        name: "Full Body A",
        user_id: null,
        created_at: "2026-01-01T00:00:00.000Z",
        is_template: true,
        source_template_id: null,
        is_favourite: false
      }
    ],
    workout_exercises: [
      {
        id: "we1",
        workout_id: "workout-a",
        exercise_id: "bodyweight-squat",
        order_index: 0,
        target_sets: 3,
        target_rep_range_low: 10,
        target_rep_range_high: 10,
        target_rest_seconds: 60,
        target_weight: null,
        superset_group_id: null
      }
    ],
    workout_exercise_set_plans: [
      { id: "wesp1", workout_exercise_id: "we1", set_number: 1, reps: 10, weight: null },
      { id: "wesp2", workout_exercise_id: "we1", set_number: 2, reps: 10, weight: null },
      { id: "wesp3", workout_exercise_id: "we1", set_number: 3, reps: 10, weight: null }
    ],
    workout_sessions: [],
    set_logs: []
  };
}
