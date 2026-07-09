import { createWorkoutRepository } from "@/features/workouts/workoutRepository";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("re-saving a workout that already has logged history", () => {
  it("updateWorkout keeps the workout_exercise id stable and does not break logged set_logs", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const workout = await repo.createWorkout({
      name: "My Workout",
      userId: TEST_USER_ID,
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 3,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 40,
          supersetGroupId: null
        }
      ]
    });
    const workoutExerciseId = workout.exercises[0].id;

    // Simulate a logged session against that exercise — the naive
    // delete-and-reinsert approach this replaced would throw a foreign key
    // violation the moment a set_logs row like this exists.
    client.__store.workout_sessions.push({
      id: "s1",
      workout_id: workout.id,
      user_id: TEST_USER_ID,
      started_at: "2026-01-01T00:00:00.000Z",
      ended_at: "2026-01-01T01:00:00.000Z",
      status: "completed",
      workout_name_snapshot: "My Workout",
      rating: null
    });
    client.__store.set_logs.push({
      id: "set1",
      session_id: "s1",
      workout_exercise_id: workoutExerciseId,
      set_number: 1,
      reps: 10,
      weight: 40,
      completed_at: "2026-01-01T00:30:00.000Z",
      exercise_name_snapshot: "Bodyweight Squat",
      target_reps_snapshot: null,
      target_rest_seconds_snapshot: null
    });

    await expect(
      repo.updateWorkout(workout.id, {
        name: "My Workout Renamed",
        exercises: [
          {
            exerciseId: "bodyweight-squat",
            orderIndex: 0,
            targetSets: 4,
            targetRepRangeLow: 8,
            targetRepRangeHigh: 8,
            targetRestSeconds: 90,
            targetWeight: 45,
            supersetGroupId: null
          }
        ]
      })
    ).resolves.not.toThrow();

    const after = await repo.getWorkoutWithExercises(workout.id);
    expect(after!.exercises[0].id).toBe(workoutExerciseId);
    expect(after!.exercises[0].targetSets).toBe(4);
    expect(after!.exercises[0].targetWeight).toBe(45);
    expect(client.__store.set_logs.find((row: { id: string }) => row.id === "set1")).toBeDefined();
  });

  it("shrinking the exercise list best-effort-deletes stale rows but keeps ones still referenced by history", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const workout = await repo.createWorkout({
      name: "Two Exercises",
      userId: TEST_USER_ID,
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 3,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: null,
          supersetGroupId: null
        },
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 1,
          targetSets: 3,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: null,
          supersetGroupId: null
        }
      ]
    });
    const secondExerciseId = workout.exercises[1].id;

    client.__store.workout_sessions.push({
      id: "s1",
      workout_id: workout.id,
      user_id: TEST_USER_ID,
      started_at: "2026-01-01T00:00:00.000Z",
      ended_at: "2026-01-01T01:00:00.000Z",
      status: "completed",
      workout_name_snapshot: "Two Exercises",
      rating: null
    });
    client.__store.set_logs.push({
      id: "set1",
      session_id: "s1",
      workout_exercise_id: secondExerciseId,
      set_number: 1,
      reps: 10,
      weight: null,
      completed_at: "2026-01-01T00:30:00.000Z",
      exercise_name_snapshot: "Bodyweight Squat",
      target_reps_snapshot: null,
      target_rest_seconds_snapshot: null
    });

    // Drop back to a single exercise at order_index 0 — order_index 1 (the
    // one with logged history) would naively be deleted.
    const updated = await repo.updateWorkout(workout.id, {
      name: "Two Exercises",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 3,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: null,
          supersetGroupId: null
        }
      ]
    });

    // The still-referenced row survives (best-effort delete is skipped on FK
    // conflict) rather than throwing and losing the whole save — it's still
    // attached to the workout by workout_id, so it still appears when
    // re-querying, alongside the one row that was actually kept.
    expect(updated.exercises.map((exercise) => exercise.id)).toContain(secondExerciseId);
    expect(
      client.__store.workout_exercises.find((row: { id: string }) => row.id === secondExerciseId)
    ).toBeDefined();
  });
});
