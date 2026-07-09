import { createProgressService } from "@/features/progress/progressService";
import { createSessionService } from "@/features/sessions/sessionService";
import { createSetLogService } from "@/features/sessions/setLogService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("exercise history progress query", () => {
  it("returns completed set history, session volume, and weight points for an exercise", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);

    for (const completedAt of ["2026-07-06T10:00:00.000Z", "2026-07-08T10:00:00.000Z"]) {
      const activeSession = await sessionService.startWorkoutSession("workout-a");
      const squat = activeSession.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");

      if (!squat) {
        throw new Error("Seed workout did not contain Bodyweight Squat.");
      }

      await setLogService.logSet({
        sessionId: activeSession.session.id,
        workoutExerciseId: squat.id,
        reps: 10,
        weight: 20,
        completedAt
      });
      await sessionService.completeSession(activeSession.session.id, { endedAt: completedAt });
    }

    const progress = await createProgressService(client).getExerciseProgress("bodyweight-squat");

    expect(progress.exercise?.name).toBe("Bodyweight Squat");
    expect(progress.historySets).toHaveLength(2);
    expect(progress.sessions).toHaveLength(2);
    expect(progress.volumePoints.map((point) => point.volume)).toEqual([200, 200]);
    expect(progress.weightPoints.map((point) => point.weight)).toEqual([20, 20]);
    expect(progress.historySets.every((set) => set.workoutNameSnapshot === "Full Body A")).toBe(true);
  });
});
