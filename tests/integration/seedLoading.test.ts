import { createExerciseRepository } from "../../src/db/repositories/exerciseRepository";
import { createWorkoutRepository } from "../../src/db/repositories/workoutRepository";
import { loadSeedData } from "../../src/db/seed/loadSeedData";
import { TestDatabase } from "../helpers/testDatabase";

describe("starter seed loading", () => {
  it("loads starter data idempotently with local image paths", async () => {
    const database = new TestDatabase();

    const firstLoad = await loadSeedData(database);
    const secondLoad = await loadSeedData(database);

    expect(firstLoad.applied).toBe(true);
    expect(secondLoad.applied).toBe(false);
    expect(database.seedVersions.has(firstLoad.version)).toBe(true);

    const exerciseRepository = createExerciseRepository(database);
    const workoutRepository = createWorkoutRepository(database);
    const exercises = await exerciseRepository.listExercises();
    const templates = await workoutRepository.listTemplateWorkouts();

    expect(await exerciseRepository.listMuscleGroups()).toHaveLength(6);
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.every((exercise) => exercise.imageUrl.startsWith("assets/seed-exercises/"))).toBe(true);
    expect(templates).toHaveLength(3);
    expect(database.workouts.size).toBe(3);
  });
});
