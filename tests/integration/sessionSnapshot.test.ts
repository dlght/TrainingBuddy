import { createSessionService } from "@/features/sessions/sessionService";
import { createSetLogService } from "@/features/sessions/setLogService";
import { createWorkoutBuilderService } from "@/features/workouts/workoutBuilderService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("completed session snapshots", () => {
  it("keeps workout name and performed set snapshots after workout edits", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const workoutBuilder = createWorkoutBuilderService(client);

    const workout = await workoutBuilder.createCustomWorkout({
      name: "Snapshot Workout",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetRestSeconds: 60,
          setPlans: [
            { reps: 8, weight: null },
            { reps: 12, weight: null }
          ]
        }
      ]
    });

    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);
    const activeSession = await sessionService.startWorkoutSession(workout.id);

    await setLogService.logSet({
      sessionId: activeSession.session.id,
      workoutExerciseId: activeSession.exercises[0].id,
      reps: 10,
      weight: 25
    });
    await sessionService.completeSession(activeSession.session.id);

    await workoutBuilder.updateCustomWorkout(workout.id, {
      name: "Edited Workout Name",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetRestSeconds: 120,
          setPlans: [
            { reps: 3, weight: null },
            { reps: 5, weight: null }
          ]
        }
      ]
    });

    const session = await sessionService.getSessionDetails(activeSession.session.id);
    const [setLog] = await setLogService.listSetLogs(activeSession.session.id);

    expect(session.session.workoutNameSnapshot).toBe("Snapshot Workout");
    expect(setLog).toMatchObject({
      exerciseNameSnapshot: "Bodyweight Squat",
      targetRepsSnapshot: "8-12",
      targetRestSecondsSnapshot: 60
    });
  });
});
