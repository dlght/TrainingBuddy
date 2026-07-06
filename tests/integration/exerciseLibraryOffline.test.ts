import { createExerciseLibraryServiceForDatabase } from "@/features/exercises/exerciseLibraryService";
import { loadSeedData } from "@/db/seed/loadSeedData";

import { TestDatabase } from "../helpers/testDatabase";

describe("exercise library offline read path", () => {
  it("reads seeded exercise groups and details without network", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network disabled"));
    const database = new TestDatabase();

    await loadSeedData(database);

    const service = createExerciseLibraryServiceForDatabase(database);
    const library = await service.getLibraryData();
    const legs = await service.listExercisesByMuscleGroup("legs");
    const detail = await service.getExerciseById("bodyweight-squat");

    expect(library.muscleGroups).toHaveLength(6);
    expect(library.exercises.length).toBeGreaterThan(0);
    expect(legs.map((exercise) => exercise.id)).toContain("bodyweight-squat");
    expect(detail).toMatchObject({
      id: "bodyweight-squat",
      name: "Bodyweight Squat",
      muscleGroupId: "legs",
      isWarmup: true
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
