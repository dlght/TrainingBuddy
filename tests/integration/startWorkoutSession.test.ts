import { createSessionService } from "@/features/sessions/sessionService";
import { createWorkoutBuilderService } from "@/features/workouts/workoutBuilderService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("starting workout sessions", () => {
  it("starts sessions from sample and custom workouts", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);

    const sampleSession = await sessionService.startWorkoutSession("workout-a");

    expect(sampleSession.session).toMatchObject({
      workoutId: "workout-a",
      userId: TEST_USER_ID,
      status: "active",
      workoutNameSnapshot: "Full Body A"
    });
    expect(sampleSession.exercises.length).toBeGreaterThan(0);

    await sessionService.discardSession(sampleSession.session.id);

    const customWorkout = await createWorkoutBuilderService(client).createCustomWorkout({
      name: "Custom A",
      exercises: [{ exerciseId: "bodyweight-squat", targetRestSeconds: 60, setPlans: [{ reps: 10, weight: null }] }]
    });
    const customSession = await sessionService.startWorkoutSession(customWorkout.id);

    expect(customSession.session.workoutId).toBe(customWorkout.id);
    expect(customSession.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Bodyweight Squat"]);
  });

  it("refuses to start a second session while one is already active", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);

    await sessionService.startWorkoutSession("workout-a");

    await expect(sessionService.startWorkoutSession("workout-a")).rejects.toThrow(
      "Resume or discard the active workout session before starting another."
    );
  });
});
