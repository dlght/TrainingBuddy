import { createSessionServiceForDatabase } from "@/features/sessions/sessionService";
import { createSetLogServiceForDatabase } from "@/features/sessions/setLogService";
import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";
import { createSessionRepository } from "@/db/repositories/sessionRepository";

import { TestDatabase } from "../helpers/testDatabase";

describe("logging workout sessions", () => {
  it("logs set entries and completes the active session", async () => {
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
    const firstExercise = activeSession.exercises[0];

    const setLog = await setLogService.logSet({
      sessionId: activeSession.session.id,
      workoutExerciseId: firstExercise.id,
      reps: "10",
      weight: "25",
      effortRpe: "7",
      completedAt: "2026-07-06T10:00:00.000Z"
    });

    expect(setLog).toMatchObject({
      setNumber: 1,
      reps: 10,
      weight: 25,
      effortRpe: 7,
      exerciseNameSnapshot: firstExercise.exerciseName,
      targetRepsSnapshot: `${firstExercise.targetRepRangeLow}-${firstExercise.targetRepRangeHigh}`,
      targetRestSecondsSnapshot: firstExercise.targetRestSeconds
    });

    const completed = await sessionService.completeSession(activeSession.session.id);
    const storedLogs = await createSessionRepository(database).listSetLogs(activeSession.session.id);

    expect(completed.session.status).toBe("completed");
    expect(completed.session.endedAt).not.toBeNull();
    expect(storedLogs).toHaveLength(1);
  });
});
