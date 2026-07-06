import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { createProgressServiceForDatabase } from "@/features/progress/progressService";
import { createSessionServiceForDatabase } from "@/features/sessions/sessionService";
import { createSetLogServiceForDatabase } from "@/features/sessions/setLogService";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";

import { TestDatabase } from "../helpers/testDatabase";

async function prepareDatabase() {
  const database = new TestDatabase();

  await loadSeedData(database);
  await createProfileServiceForDatabase(database).saveProfileInput({
    id: "local-user",
    name: "Alex",
    bodyweight: 75,
    height: null,
    weightUnit: "kg",
    experienceLevel: "new",
    goal: "Build consistency"
  });

  return database;
}

describe("exercise history progress query", () => {
  it("returns completed set history, session volume, and weight points for an exercise", async () => {
    const database = await prepareDatabase();
    const [template] = await createWorkoutRepository(database).listTemplateWorkouts();
    const sessionService = createSessionServiceForDatabase(database);
    const setLogService = createSetLogServiceForDatabase(database);

    for (const completedAt of ["2026-07-06T10:00:00.000Z", "2026-07-08T10:00:00.000Z"]) {
      const activeSession = await sessionService.startWorkoutSession(template.id, "local-user");
      const squat = activeSession.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");

      if (!squat) {
        throw new Error("Seed workout did not contain Bodyweight Squat.");
      }

      await setLogService.logSet({
        sessionId: activeSession.session.id,
        workoutExerciseId: squat.id,
        reps: 10,
        weight: 20,
        effortRpe: 7,
        completedAt
      });
      await sessionService.completeSession(activeSession.session.id);
    }

    const progress = await createProgressServiceForDatabase(database).getExerciseProgress("bodyweight-squat");

    expect(progress.exercise?.name).toBe("Bodyweight Squat");
    expect(progress.historySets).toHaveLength(2);
    expect(progress.sessions).toHaveLength(2);
    expect(progress.volumePoints.map((point) => point.volume)).toEqual([200, 200]);
    expect(progress.weightPoints.map((point) => point.weight)).toEqual([20, 20]);
    expect(progress.historySets.every((set) => set.workoutNameSnapshot === "Full Body A")).toBe(true);
  });
});
