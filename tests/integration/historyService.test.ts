import { createHistoryService } from "@/features/progress/historyService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

function seedSessionsFixture() {
  const seed = baseSeed();

  seed.workout_sessions = [
    {
      id: "s1",
      workout_id: "workout-a",
      user_id: TEST_USER_ID,
      started_at: "2026-01-01T00:00:00.000Z",
      ended_at: "2026-01-01T01:00:00.000Z",
      status: "completed",
      workout_name_snapshot: "Full Body A",
      rating: 4
    },
    {
      id: "s2",
      workout_id: "workout-a",
      user_id: TEST_USER_ID,
      started_at: "2026-01-02T00:00:00.000Z",
      ended_at: "2026-01-02T01:00:00.000Z",
      status: "completed",
      workout_name_snapshot: "Full Body A",
      rating: null
    },
    // Active and discarded sessions must never appear in history.
    {
      id: "s3",
      workout_id: "workout-a",
      user_id: TEST_USER_ID,
      started_at: "2026-01-03T00:00:00.000Z",
      ended_at: null,
      status: "active",
      workout_name_snapshot: "Full Body A",
      rating: null
    },
    {
      id: "s4",
      workout_id: "workout-a",
      user_id: TEST_USER_ID,
      started_at: "2026-01-04T00:00:00.000Z",
      ended_at: "2026-01-04T00:05:00.000Z",
      status: "discarded",
      workout_name_snapshot: "Full Body A",
      rating: null
    }
  ];
  seed.set_logs = [
    {
      id: "set1",
      session_id: "s1",
      workout_exercise_id: "we1",
      set_number: 1,
      reps: 10,
      weight: 40,
      completed_at: "2026-01-01T00:10:00.000Z",
      exercise_name_snapshot: "Bodyweight Squat",
      target_reps_snapshot: null,
      target_rest_seconds_snapshot: null
    },
    {
      id: "set2",
      session_id: "s1",
      workout_exercise_id: "we1",
      set_number: 2,
      reps: 10,
      weight: 40,
      completed_at: "2026-01-01T00:20:00.000Z",
      exercise_name_snapshot: "Bodyweight Squat",
      target_reps_snapshot: null,
      target_rest_seconds_snapshot: null
    }
  ];

  return seed;
}

describe("historyService.listCompletedSessions", () => {
  it("lists completed sessions most-recent-first with set count and volume, excluding active/discarded sessions", async () => {
    const client = createFakeSupabaseClient(seedSessionsFixture(), TEST_USER_ID);
    const service = createHistoryService(client);

    const sessions = await service.listCompletedSessions();

    expect(sessions.map((session) => session.id)).toEqual(["s2", "s1"]);

    const first = sessions.find((session) => session.id === "s1");
    expect(first).toMatchObject({ workoutId: "workout-a", workoutName: "Full Body A", totalSets: 2, totalVolume: 800, rating: 4 });

    const second = sessions.find((session) => session.id === "s2");
    expect(second).toMatchObject({ totalSets: 0, totalVolume: 0, rating: null });
  });

  it("returns an empty list when there are no completed sessions", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const service = createHistoryService(client);

    expect(await service.listCompletedSessions()).toEqual([]);
  });
});

describe("historyService.listCompletedSessionsInRange", () => {
  function seedRangeFixture() {
    const seed = seedSessionsFixture();

    seed.workout_sessions.push({
      id: "s5",
      workout_id: "workout-a",
      user_id: TEST_USER_ID,
      started_at: "2026-02-15T00:00:00.000Z",
      ended_at: "2026-02-15T01:00:00.000Z",
      status: "completed",
      workout_name_snapshot: "Full Body A",
      rating: null
    });

    return seed;
  }

  it("returns only completed sessions within the given [start, end) range", async () => {
    const client = createFakeSupabaseClient(seedRangeFixture(), TEST_USER_ID);
    const service = createHistoryService(client);

    const sessions = await service.listCompletedSessionsInRange("2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z");

    expect(sessions.map((session) => session.id)).toEqual(["s1"]);
    expect(sessions[0]).toMatchObject({ rating: 4 });
  });

  it("excludes sessions ending exactly at the range's end boundary", async () => {
    const client = createFakeSupabaseClient(seedRangeFixture(), TEST_USER_ID);
    const service = createHistoryService(client);

    const sessions = await service.listCompletedSessionsInRange("2026-01-01T02:00:00.000Z", "2026-01-02T01:00:00.000Z");

    expect(sessions).toEqual([]);
  });

  it("returns an empty list for a month range with no sessions", async () => {
    const client = createFakeSupabaseClient(seedRangeFixture(), TEST_USER_ID);
    const service = createHistoryService(client);

    const sessions = await service.listCompletedSessionsInRange("2026-03-01T00:00:00.000Z", "2026-04-01T00:00:00.000Z");

    expect(sessions).toEqual([]);
  });

  it("lists sessions most-recent-first, not oldest-first", async () => {
    const seed = seedSessionsFixture();

    seed.workout_sessions.push({
      id: "s6",
      workout_id: "workout-a",
      user_id: TEST_USER_ID,
      started_at: "2026-01-01T12:00:00.000Z",
      ended_at: "2026-01-01T13:00:00.000Z",
      status: "completed",
      workout_name_snapshot: "Full Body A",
      rating: null
    });

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createHistoryService(client);

    const sessions = await service.listCompletedSessionsInRange("2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z");

    // s6 (13:00) ended after s1 (01:00) on the same day — s6 must come first.
    expect(sessions.map((session) => session.id)).toEqual(["s6", "s1"]);
  });
});
