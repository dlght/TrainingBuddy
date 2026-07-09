import { createExerciseLibraryService } from "@/features/exercises/exerciseLibraryService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed } from "../helpers/seedFixture";

describe("exercise library read path", () => {
  it("reads seeded exercise groups and details", async () => {
    const client = createFakeSupabaseClient(baseSeed());
    const service = createExerciseLibraryService(client);

    const library = await service.getLibraryData();
    const legs = await service.listExercisesByMuscleGroup("legs");
    const detail = await service.getExerciseById("bodyweight-squat");

    expect(library.muscleGroups).toHaveLength(1);
    expect(library.exercises.length).toBeGreaterThan(0);
    expect(legs.map((exercise) => exercise.id)).toContain("bodyweight-squat");
    expect(detail).toMatchObject({
      id: "bodyweight-squat",
      name: "Bodyweight Squat",
      muscleGroupId: "legs",
      isWarmup: true
    });
  });

  it("returns null for an exercise id that doesn't exist", async () => {
    const client = createFakeSupabaseClient(baseSeed());
    const service = createExerciseLibraryService(client);

    expect(await service.getExerciseById("does-not-exist")).toBeNull();
  });
});
