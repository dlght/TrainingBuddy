import { createSessionService } from "@/features/sessions/sessionService";
import { createSetLogService } from "@/features/sessions/setLogService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("logging workout sessions", () => {
  it("logs set entries and completes the active session", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);

    const activeSession = await sessionService.startWorkoutSession("workout-a");
    const firstExercise = activeSession.exercises[0];

    const setLog = await setLogService.logSet({
      sessionId: activeSession.session.id,
      workoutExerciseId: firstExercise.id,
      reps: "10",
      weight: "25",
      completedAt: "2026-07-06T10:00:00.000Z"
    });

    expect(setLog).toMatchObject({
      setNumber: 1,
      reps: 10,
      weight: 25,
      exerciseNameSnapshot: firstExercise.exerciseName,
      targetRepsSnapshot: `${firstExercise.targetRepRangeLow}-${firstExercise.targetRepRangeHigh}`,
      targetRestSecondsSnapshot: firstExercise.targetRestSeconds
    });

    const completed = await sessionService.completeSession(activeSession.session.id);
    const storedLogs = await setLogService.listSetLogs(activeSession.session.id);

    expect(completed.session.status).toBe("completed");
    expect(completed.session.endedAt).not.toBeNull();
    expect(storedLogs).toHaveLength(1);
  });

  it("rejects a set log once the session is no longer active", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);

    const activeSession = await sessionService.startWorkoutSession("workout-a");
    await sessionService.completeSession(activeSession.session.id);

    await expect(
      setLogService.logSet({
        sessionId: activeSession.session.id,
        workoutExerciseId: activeSession.exercises[0].id,
        reps: "10",
        weight: "25"
      })
    ).rejects.toThrow("Sets can only be logged to an active session.");
  });
});
