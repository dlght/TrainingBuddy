import { createSessionService } from "@/features/sessions/sessionService";
import { createSetLogService } from "@/features/sessions/setLogService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("finishing a session with no logged sets", () => {
  it("completes a session that has zero logged sets", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);

    const activeSession = await sessionService.startWorkoutSession("workout-a");
    const completed = await sessionService.completeSession(activeSession.session.id);

    expect(completed.session.status).toBe("completed");
    expect(completed.session.endedAt).not.toBeNull();
    expect(completed.setLogs).toHaveLength(0);
  });

  it("completes a session with only some exercises logged", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);

    const activeSession = await sessionService.startWorkoutSession("workout-a");
    const firstExercise = activeSession.exercises[0];

    await setLogService.logSet({
      sessionId: activeSession.session.id,
      workoutExerciseId: firstExercise.id,
      reps: "10",
      weight: "25"
    });

    const completed = await sessionService.completeSession(activeSession.session.id);

    expect(completed.session.status).toBe("completed");
    expect(completed.setLogs).toHaveLength(1);
  });
});
