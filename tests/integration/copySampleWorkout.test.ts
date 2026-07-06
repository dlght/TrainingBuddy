import { createWorkoutRepository } from "@/db/repositories/workoutRepository";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createWorkoutBuilderServiceForDatabase } from "@/features/workouts/workoutBuilderService";

import { TestDatabase } from "../helpers/testDatabase";

describe("copying sample workouts", () => {
  it("copies a protected sample before custom editing", async () => {
    const database = new TestDatabase();

    await loadSeedData(database);

    const repository = createWorkoutRepository(database);
    const service = createWorkoutBuilderServiceForDatabase(database);
    const [template] = await repository.listTemplateWorkouts();

    await expect(
      service.updateCustomWorkout(template.id, {
        name: "Edited Sample",
        exercises: [
          {
            exerciseId: "bodyweight-squat",
            targetSets: 2,
            targetRepRangeLow: 8,
            targetRepRangeHigh: 12,
            targetRestSeconds: 60
          }
        ]
      })
    ).rejects.toThrow("Sample workout templates are protected");

    const copied = await service.copyTemplateWorkout(template.id, "local-user");
    const original = await repository.getWorkoutWithExercises(template.id);

    expect(copied).toMatchObject({
      isTemplate: false,
      userId: "local-user",
      sourceTemplateId: template.id
    });
    expect(copied.exercises).toHaveLength(original?.exercises.length ?? 0);
    expect(original?.isTemplate).toBe(true);

    const updatedCopy = await service.updateCustomWorkout(copied.id, {
      name: "Full Body A Custom",
      exercises: copied.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        targetSets: exercise.targetSets,
        targetRepRangeLow: exercise.targetRepRangeLow,
        targetRepRangeHigh: exercise.targetRepRangeHigh,
        targetRestSeconds: exercise.targetRestSeconds,
        supersetGroupId: exercise.supersetGroupId
      }))
    });

    expect(updatedCopy.name).toBe("Full Body A Custom");
    expect((await repository.getWorkoutById(template.id))?.name).toBe(template.name);
  });
});
