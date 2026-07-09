import { createWorkoutBuilderService } from "@/features/workouts/workoutBuilderService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

function seedWithExtraExercises() {
  const seed = baseSeed();

  seed.exercises.push(
    {
      id: "incline-push-up",
      name: "Incline Push-Up",
      muscle_group_id: "legs",
      equipment: "bodyweight",
      image_url: "assets/seed-exercises/placeholder.txt",
      instructions: "Push up.",
      is_warmup: false,
      video_url: null,
      source: null,
      source_id: null,
      license_author: null,
      license_url: null
    },
    {
      id: "one-arm-dumbbell-row",
      name: "One-Arm Dumbbell Row",
      muscle_group_id: "legs",
      equipment: "dumbbell",
      image_url: "assets/seed-exercises/placeholder.txt",
      instructions: "Row.",
      is_warmup: false,
      video_url: null,
      source: null,
      source_id: null,
      license_author: null,
      license_url: null
    }
  );

  return seed;
}

describe("custom workout CRUD", () => {
  it("creates, reloads, edits, and deletes a custom workout", async () => {
    const client = createFakeSupabaseClient(seedWithExtraExercises(), TEST_USER_ID);
    const service = createWorkoutBuilderService(client);

    const created = await service.createCustomWorkout({
      name: "Starter Strength",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetRestSeconds: "60",
          setPlans: [
            { reps: "8", weight: "" },
            { reps: "12", weight: "" }
          ]
        },
        {
          exerciseId: "incline-push-up",
          targetRestSeconds: "60",
          setPlans: [
            { reps: "6", weight: "" },
            { reps: "10", weight: "" }
          ]
        },
        {
          exerciseId: "one-arm-dumbbell-row",
          targetRestSeconds: "60",
          setPlans: [
            { reps: "8", weight: "" },
            { reps: "12", weight: "" }
          ]
        }
      ]
    });

    expect(created).toMatchObject({ name: "Starter Strength", userId: TEST_USER_ID, isTemplate: false });
    expect(created.exercises).toHaveLength(3);

    const reloaded = await service.getWorkout(created.id);

    expect(reloaded?.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      "bodyweight-squat",
      "incline-push-up",
      "one-arm-dumbbell-row"
    ]);

    const updated = await service.updateCustomWorkout(created.id, {
      name: "Starter Strength Updated",
      exercises: [
        {
          exerciseId: "incline-push-up",
          targetRestSeconds: 45,
          setPlans: [
            { reps: 8, weight: null },
            { reps: 10, weight: null },
            { reps: 8, weight: null }
          ]
        },
        {
          exerciseId: "one-arm-dumbbell-row",
          targetRestSeconds: 45,
          setPlans: [
            { reps: 8, weight: null },
            { reps: 10, weight: null },
            { reps: 8, weight: null }
          ]
        }
      ]
    });

    expect(updated.name).toBe("Starter Strength Updated");
    expect(updated.exercises).toHaveLength(2);
    expect(updated.exercises.map((exercise) => exercise.orderIndex)).toEqual([0, 1]);

    await service.deleteCustomWorkout(created.id);

    expect(await service.getWorkout(created.id)).toBeNull();
  });
});
