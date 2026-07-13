import { createSessionRepository } from "@/features/sessions/sessionRepository";
import { createSessionService } from "@/features/sessions/sessionService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("session pause/resume", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("pauseSession marks the session paused and records when it was paused", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionRepository = createSessionRepository(client);

    const session = await sessionRepository.startSession({
      workoutId: "workout-a",
      userId: TEST_USER_ID,
      workoutNameSnapshot: "Full Body A"
    });

    await sessionRepository.pauseSession(session.id);
    const paused = await sessionRepository.getSessionById(session.id);

    expect(paused?.status).toBe("paused");
    expect(paused?.pausedAt).toBe("2026-01-01T10:00:00.000Z");
  });

  it("resumeSession shifts started_at forward by exactly the paused duration and clears paused_at", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionRepository = createSessionRepository(client);

    const session = await sessionRepository.startSession({
      workoutId: "workout-a",
      userId: TEST_USER_ID,
      workoutNameSnapshot: "Full Body A",
      startedAt: "2026-01-01T09:55:00.000Z"
    });

    await sessionRepository.pauseSession(session.id);

    jest.setSystemTime(new Date("2026-01-01T10:05:00.000Z"));

    await sessionRepository.resumeSession(session.id);
    const resumed = await sessionRepository.getSessionById(session.id);

    expect(resumed?.status).toBe("active");
    expect(resumed?.pausedAt).toBeNull();
    expect(resumed?.startedAt).toBe("2026-01-01T10:00:00.000Z");
  });

  it("resuming a session that was never paused is a no-op", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionRepository = createSessionRepository(client);

    const session = await sessionRepository.startSession({
      workoutId: "workout-a",
      userId: TEST_USER_ID,
      workoutNameSnapshot: "Full Body A"
    });

    await sessionRepository.resumeSession(session.id);
    const stillActive = await sessionRepository.getSessionById(session.id);

    expect(stillActive?.status).toBe("active");
    expect(stillActive?.startedAt).toBe(session.startedAt);
  });

  it("getActiveSession finds a paused session, and discardSession can discard it", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const sessionRepository = createSessionRepository(client);

    const active = await sessionService.startWorkoutSession("workout-a");
    await sessionRepository.pauseSession(active.session.id);

    const found = await sessionRepository.getActiveSession(TEST_USER_ID);

    expect(found?.id).toBe(active.session.id);
    expect(found?.status).toBe("paused");

    await sessionService.discardSession(active.session.id);
    const discarded = await sessionRepository.getSessionById(active.session.id);

    expect(discarded?.status).toBe("discarded");
  });

  it("resumeActiveSession transitions a paused session back to active with the started_at shift applied", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);

    const active = await sessionService.startWorkoutSession("workout-a");
    await sessionService.pauseActiveSession(active.session.id);

    jest.setSystemTime(new Date("2026-01-01T10:02:00.000Z"));

    const resumed = await sessionService.resumeActiveSession();

    expect(resumed?.session.status).toBe("active");
    expect(resumed?.session.startedAt).toBe(
      new Date(new Date(active.session.startedAt).getTime() + 2 * 60 * 1000).toISOString()
    );
  });
});
