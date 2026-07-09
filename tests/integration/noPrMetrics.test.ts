import { createProgressService } from "@/features/progress/progressService";
import { createSessionService } from "@/features/sessions/sessionService";
import { createSetLogService } from "@/features/sessions/setLogService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("progress excludes PR metrics", () => {
  it("does not expose highest weight or one-rep-max records", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);

    const activeSession = await sessionService.startWorkoutSession("workout-a");
    const squat = activeSession.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");

    if (!squat) {
      throw new Error("Seed workout did not contain Bodyweight Squat.");
    }

    await setLogService.logSet({ sessionId: activeSession.session.id, workoutExerciseId: squat.id, reps: 5, weight: 100 });
    await sessionService.completeSession(activeSession.session.id);

    const progress = await createProgressService(client).getExerciseProgress("bodyweight-squat");

    expect(progress).not.toHaveProperty("highestWeight");
    expect(progress).not.toHaveProperty("oneRepMax");
    expect(JSON.stringify(progress).toLowerCase()).not.toContain("one rep max");
  });
});
