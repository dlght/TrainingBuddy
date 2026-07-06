import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { createSessionServiceForDatabase } from "@/features/sessions/sessionService";
import { createSetLogServiceForDatabase } from "@/features/sessions/setLogService";
import { createWorkoutBuilderServiceForDatabase } from "@/features/workouts/workoutBuilderService";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createSessionRepository } from "@/db/repositories/sessionRepository";

import { TestDatabase } from "../helpers/testDatabase";

describe("completed session snapshots", () => {
  it("keeps workout name and performed set snapshots after workout edits", async () => {
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

    const workoutBuilder = createWorkoutBuilderServiceForDatabase(database);
    const workout = await workoutBuilder.createCustomWorkout(
      {
        name: "Snapshot Workout",
        exercises: [
          {
            exerciseId: "bodyweight-squat",
            targetSets: 1,
            targetRepRangeLow: 8,
            targetRepRangeHigh: 12,
            targetRestSeconds: 60
          }
        ]
      },
      "local-user"
    );
    const sessionService = createSessionServiceForDatabase(database);
    const setLogService = createSetLogServiceForDatabase(database);
    const activeSession = await sessionService.startWorkoutSession(workout.id, "local-user");

    await setLogService.logSet({
      sessionId: activeSession.session.id,
      workoutExerciseId: activeSession.exercises[0].id,
      reps: 10,
      weight: 25,
      effortRpe: 8
    });
    await sessionService.completeSession(activeSession.session.id);
    await workoutBuilder.updateCustomWorkout(workout.id, {
      name: "Edited Workout Name",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetSets: 1,
          targetRepRangeLow: 3,
          targetRepRangeHigh: 5,
          targetRestSeconds: 120
        }
      ]
    });

    const session = await createSessionRepository(database).getSessionById(activeSession.session.id);
    const [setLog] = await createSessionRepository(database).listSetLogs(activeSession.session.id);

    expect(session?.workoutNameSnapshot).toBe("Snapshot Workout");
    expect(setLog).toMatchObject({
      exerciseNameSnapshot: "Bodyweight Squat",
      targetRepsSnapshot: "8-12",
      targetRestSecondsSnapshot: 60
    });
  });
});
