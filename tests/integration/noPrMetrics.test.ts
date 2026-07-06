import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { createProgressServiceForDatabase } from "@/features/progress/progressService";
import { createSessionServiceForDatabase } from "@/features/sessions/sessionService";
import { createSetLogServiceForDatabase } from "@/features/sessions/setLogService";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";

import { TestDatabase } from "../helpers/testDatabase";

describe("progress excludes PR metrics", () => {
  it("does not expose highest weight or one-rep-max records", async () => {
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

    const [template] = await createWorkoutRepository(database).listTemplateWorkouts();
    const sessionService = createSessionServiceForDatabase(database);
    const setLogService = createSetLogServiceForDatabase(database);
    const activeSession = await sessionService.startWorkoutSession(template.id, "local-user");
    const squat = activeSession.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");

    if (!squat) {
      throw new Error("Seed workout did not contain Bodyweight Squat.");
    }

    await setLogService.logSet({
      sessionId: activeSession.session.id,
      workoutExerciseId: squat.id,
      reps: 5,
      weight: 100,
      effortRpe: 9
    });
    await sessionService.completeSession(activeSession.session.id);

    const progress = await createProgressServiceForDatabase(database).getExerciseProgress("bodyweight-squat");

    expect(progress).not.toHaveProperty("highestWeight");
    expect(progress).not.toHaveProperty("oneRepMax");
    expect(JSON.stringify(progress).toLowerCase()).not.toContain("one rep max");
  });
});
