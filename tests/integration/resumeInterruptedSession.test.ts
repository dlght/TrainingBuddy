import { createSessionService } from "@/features/sessions/sessionService";
import { createSetLogService } from "@/features/sessions/setLogService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("interrupted session resume and discard", () => {
  it("resumes logged set data after recreating services and can discard the active session", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);

    const started = await sessionService.startWorkoutSession("workout-a");

    await setLogService.logSet({
      sessionId: started.session.id,
      workoutExerciseId: started.exercises[0].id,
      reps: 8,
      weight: 20
    });

    const resumed = await createSessionService(client).resumeActiveSession();

    expect(resumed?.session.id).toBe(started.session.id);
    expect(resumed?.setLogs).toHaveLength(1);

    await createSessionService(client).discardSession(started.session.id);

    expect(await createSessionService(client).resumeActiveSession()).toBeNull();

    const discarded = await createSessionService(client).getSessionDetails(started.session.id);
    expect(discarded.session.status).toBe("discarded");
  });
});
