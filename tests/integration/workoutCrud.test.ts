import { createWorkoutBuilderServiceForDatabase } from "@/features/workouts/workoutBuilderService";
import { loadSeedData } from "@/db/seed/loadSeedData";

import { TestDatabase } from "../helpers/testDatabase";

describe("custom workout CRUD", () => {
  it("creates, reloads, edits, and deletes a custom workout", async () => {
    const database = new TestDatabase();

    await loadSeedData(database);

    const service = createWorkoutBuilderServiceForDatabase(database);
    const created = await service.createCustomWorkout(
      {
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
      },
      "local-user"
    );

    expect(created).toMatchObject({
      name: "Starter Strength",
      userId: "local-user",
      isTemplate: false
    });
    expect(created.exercises).toHaveLength(3);

    const reloadedService = createWorkoutBuilderServiceForDatabase(database);
    const reloaded = await reloadedService.getWorkout(created.id);

    expect(reloaded?.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      "bodyweight-squat",
      "incline-push-up",
      "one-arm-dumbbell-row"
    ]);

    const updated = await reloadedService.updateCustomWorkout(created.id, {
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

    await reloadedService.deleteCustomWorkout(created.id);

    expect(await reloadedService.getWorkout(created.id)).toBeNull();
  });
});
