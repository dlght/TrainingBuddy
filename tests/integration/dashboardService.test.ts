import { createDashboardService } from "@/features/progress/dashboardService";
import { createSessionRepository } from "@/features/sessions/sessionRepository";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("dashboardService.getWeeklyDashboardStats", () => {
  it("summarizes recent completed sessions into daily volume and consistency", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionRepository = createSessionRepository(client);

    const today = new Date().toISOString();
    const session = await sessionRepository.startSession({
      workoutId: "workout-a",
      userId: TEST_USER_ID,
      workoutNameSnapshot: "Full Body A",
      startedAt: today
    });
    await sessionRepository.addSetLog({
      sessionId: session.id,
      workoutExerciseId: "we1",
      setNumber: 1,
      reps: 10,
      weight: 20,
      exerciseNameSnapshot: "Bodyweight Squat",
      targetRepsSnapshot: null,
      targetRestSecondsSnapshot: null,
      completedAt: today
    });
    await sessionRepository.completeSession(session.id, { endedAt: today });

    const stats = await createDashboardService(client).getWeeklyDashboardStats();

    expect(stats.days).toHaveLength(6);
    expect(stats.days.some((day) => day.setCount > 0)).toBe(true);
    expect(stats.consistencyPercent).toBeGreaterThan(0);
  });

  it("returns zeroed stats when there is no recent activity", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);

    const stats = await createDashboardService(client).getWeeklyDashboardStats();

    expect(stats.days.every((day) => day.volume === 0 && day.setCount === 0)).toBe(true);
    expect(stats.consistencyPercent).toBe(0);
  });
});
