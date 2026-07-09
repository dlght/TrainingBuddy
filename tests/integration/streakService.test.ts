import { createSessionRepository } from "@/features/sessions/sessionRepository";
import { createStreakService } from "@/features/progress/streakService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function seedCompletedSession(sessionRepository: ReturnType<typeof createSessionRepository>, daysAgo: number) {
  const session = await sessionRepository.startSession({
    workoutId: "workout-a",
    userId: TEST_USER_ID,
    workoutNameSnapshot: "Full Body A",
    startedAt: daysAgoIso(daysAgo)
  });

  await sessionRepository.completeSession(session.id, { endedAt: daysAgoIso(daysAgo) });
}

async function seedDiscardedSession(sessionRepository: ReturnType<typeof createSessionRepository>, daysAgo: number) {
  const session = await sessionRepository.startSession({
    workoutId: "workout-a",
    userId: TEST_USER_ID,
    workoutNameSnapshot: "Full Body A",
    startedAt: daysAgoIso(daysAgo)
  });

  await sessionRepository.updateSessionStatus(session.id, "discarded", daysAgoIso(daysAgo));
}

describe("streakService", () => {
  it("returns 0 when there are no completed sessions", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);

    expect(await createStreakService(client).getCurrentStreak()).toBe(0);
  });

  it("counts consecutive days of completed sessions ending today", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionRepository = createSessionRepository(client);

    await seedCompletedSession(sessionRepository, 0);
    await seedCompletedSession(sessionRepository, 1);
    await seedCompletedSession(sessionRepository, 2);

    expect(await createStreakService(client).getCurrentStreak()).toBe(3);
  });

  it("excludes discarded and still-active sessions from the streak", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionRepository = createSessionRepository(client);

    await seedCompletedSession(sessionRepository, 0);
    await seedDiscardedSession(sessionRepository, 1);
    await sessionRepository.startSession({
      workoutId: "workout-a",
      userId: TEST_USER_ID,
      workoutNameSnapshot: "Full Body A",
      startedAt: daysAgoIso(2)
    });

    expect(await createStreakService(client).getCurrentStreak()).toBe(1);
  });

  it("resets after a gap in completed sessions", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionRepository = createSessionRepository(client);

    await seedCompletedSession(sessionRepository, 0);
    // gap: no session yesterday (daysAgo 1)
    await seedCompletedSession(sessionRepository, 2);

    expect(await createStreakService(client).getCurrentStreak()).toBe(1);
  });
});
