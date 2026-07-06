import { createWorkoutRepository } from "../../src/db/repositories/workoutRepository";
import { loadSeedData } from "../../src/db/seed/loadSeedData";
import { TestDatabase } from "../helpers/testDatabase";

describe("sample workout templates", () => {
  it("seeds exactly three protected templates that must be copied before editing", async () => {
    const database = new TestDatabase();
    const workoutRepository = createWorkoutRepository(database);

    await loadSeedData(database);

    const templates = await workoutRepository.listTemplateWorkouts();

    expect(templates.map((workout) => workout.name)).toEqual([
      "Full Body A",
      "Full Body B",
      "Full Body C"
    ]);
    expect(templates.every((workout) => workout.isTemplate && workout.userId === null)).toBe(true);

    await expect(workoutRepository.renameWorkout(templates[0].id, "Edited Template")).rejects.toThrow(
      "Sample workout templates are protected"
    );

    const copied = await workoutRepository.copyTemplateWorkout(templates[0].id, "user-1");
    const original = await workoutRepository.getWorkoutWithExercises(templates[0].id);

    expect(copied.isTemplate).toBe(false);
    expect(copied.userId).toBe("user-1");
    expect(copied.sourceTemplateId).toBe(templates[0].id);
    expect(original).not.toBeNull();
    expect(copied.exercises).toHaveLength(original?.exercises.length ?? 0);
    expect((await workoutRepository.getWorkoutById(templates[0].id))?.name).toBe("Full Body A");
  });
});
