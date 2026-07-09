import { createWorkoutRepository } from "@/features/workouts/workoutRepository";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("per-set plan CRUD via workoutRepository", () => {
  it("stores an explicit non-uniform plan and reads it back in set-number order", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const workout = await repo.createWorkout({
      name: "Ramping Squats",
      userId: TEST_USER_ID,
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 2,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 15,
          supersetGroupId: null,
          setPlans: [
            { setNumber: 1, reps: 10, weight: 15 },
            { setNumber: 2, reps: 12, weight: 12 }
          ]
        }
      ]
    });

    expect(
      workout.exercises[0].setPlans.map((plan) => ({ setNumber: plan.setNumber, reps: plan.reps, weight: plan.weight }))
    ).toEqual([
      { setNumber: 1, reps: 10, weight: 15 },
      { setNumber: 2, reps: 12, weight: 12 }
    ]);
  });

  it("derives a uniform plan when setPlans is omitted", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const workout = await repo.createWorkout({
      name: "Uniform Squats",
      userId: TEST_USER_ID,
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 3,
          targetRepRangeLow: 8,
          targetRepRangeHigh: 8,
          targetRestSeconds: 60,
          targetWeight: 40,
          supersetGroupId: null
        }
      ]
    });

    expect(
      workout.exercises[0].setPlans.map((plan) => ({ setNumber: plan.setNumber, reps: plan.reps, weight: plan.weight }))
    ).toEqual([
      { setNumber: 1, reps: 8, weight: 40 },
      { setNumber: 2, reps: 8, weight: 40 },
      { setNumber: 3, reps: 8, weight: 40 }
    ]);
  });

  it("updateWorkout replaces the plan and does not break existing logged history", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const workout = await repo.createWorkout({
      name: "Squats",
      userId: TEST_USER_ID,
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 1,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 20,
          supersetGroupId: null
        }
      ]
    });
    const workoutExerciseId = workout.exercises[0].id;

    client.__store.workout_sessions.push({
      id: "s1",
      workout_id: workout.id,
      user_id: TEST_USER_ID,
      started_at: "2026-01-01T00:00:00.000Z",
      ended_at: "2026-01-01T01:00:00.000Z",
      status: "completed",
      workout_name_snapshot: "Squats",
      rating: null
    });
    client.__store.set_logs.push({
      id: "set1",
      session_id: "s1",
      workout_exercise_id: workoutExerciseId,
      set_number: 1,
      reps: 10,
      weight: 20,
      completed_at: "2026-01-01T00:30:00.000Z",
      exercise_name_snapshot: "Bodyweight Squat",
      target_reps_snapshot: null,
      target_rest_seconds_snapshot: null
    });

    const updated = await repo.updateWorkout(workout.id, {
      name: "Squats",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 2,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 20,
          supersetGroupId: null,
          setPlans: [
            { setNumber: 1, reps: 10, weight: 20 },
            { setNumber: 2, reps: 8, weight: 25 }
          ]
        }
      ]
    });

    expect(updated.exercises[0].id).toBe(workoutExerciseId);
    expect(
      updated.exercises[0].setPlans.map((plan) => ({ setNumber: plan.setNumber, reps: plan.reps, weight: plan.weight }))
    ).toEqual([
      { setNumber: 1, reps: 10, weight: 20 },
      { setNumber: 2, reps: 8, weight: 25 }
    ]);
    expect(client.__store.set_logs.find((row: { id: string }) => row.id === "set1")).toBeDefined();
  });
});
