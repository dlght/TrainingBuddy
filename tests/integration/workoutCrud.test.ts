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
            targetSets: "2",
            targetRepRangeLow: "8",
            targetRepRangeHigh: "12",
            targetRestSeconds: "60"
          },
          {
            exerciseId: "incline-push-up",
            targetSets: "2",
            targetRepRangeLow: "6",
            targetRepRangeHigh: "10",
            targetRestSeconds: "60"
          },
          {
            exerciseId: "one-arm-dumbbell-row",
            targetSets: "2",
            targetRepRangeLow: "8",
            targetRepRangeHigh: "12",
            targetRestSeconds: "60"
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
          targetSets: 3,
          targetRepRangeLow: 8,
          targetRepRangeHigh: 10,
          targetRestSeconds: 45,
          supersetGroupId: "superset-a"
        },
        {
          exerciseId: "one-arm-dumbbell-row",
          targetSets: 3,
          targetRepRangeLow: 8,
          targetRepRangeHigh: 10,
          targetRestSeconds: 45,
          supersetGroupId: "superset-a"
        }
      ]
    });

    expect(updated.name).toBe("Starter Strength Updated");
    expect(updated.exercises).toHaveLength(2);
    expect(updated.exercises.map((exercise) => exercise.orderIndex)).toEqual([0, 1]);
    expect(updated.exercises.every((exercise) => exercise.supersetGroupId === "superset-a")).toBe(true);

    await reloadedService.deleteCustomWorkout(created.id);

    expect(await reloadedService.getWorkout(created.id)).toBeNull();
  });
});
