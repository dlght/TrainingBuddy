import { createExerciseRepository } from "../../src/db/repositories/exerciseRepository";
import { createWorkoutRepository } from "../../src/db/repositories/workoutRepository";
import { loadSeedData } from "../../src/db/seed/loadSeedData";
import { TestDatabase } from "../helpers/testDatabase";

describe("final seed templates", () => {
  it("preloads exactly three finalized sample workouts on a fresh seed", async () => {
    const database = new TestDatabase();

    await loadSeedData(database);

    const exerciseRepository = createExerciseRepository(database);
    const workoutRepository = createWorkoutRepository(database);
    const templates = await workoutRepository.listTemplateWorkouts();
    const exercises = await exerciseRepository.listExercises();

    expect(templates.map((template) => template.name)).toEqual([
      "Full Body A",
      "Full Body B",
      "Full Body C"
    ]);
    expect(templates).toHaveLength(3);
    expect(exercises).toHaveLength(24);
    expect(exercises.every((exercise) => exercise.imageUrl.startsWith("assets/seed-exercises/"))).toBe(true);

    for (const template of templates) {
      const workout = await workoutRepository.getWorkoutWithExercises(template.id);

      expect(workout).not.toBeNull();
      expect(workout?.isTemplate).toBe(true);
      expect(workout?.userId).toBeNull();
      expect(workout?.exercises).toHaveLength(8);
    }
  });
});
