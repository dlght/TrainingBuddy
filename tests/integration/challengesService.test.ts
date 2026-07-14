import { createChallengesService } from "@/features/challenges/challengesService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

const BADGE_CATALOG = [
  { id: "lifetime-workouts-10", category: "lifetime_workouts", threshold: 10, label: "10 workouts" },
  { id: "lifetime-workouts-50", category: "lifetime_workouts", threshold: 50, label: "50 workouts" },
  { id: "streak-1", category: "streak", threshold: 1, label: "1 day streak" },
  { id: "streak-3", category: "streak", threshold: 3, label: "3 day streak" },
  { id: "streak-5", category: "streak", threshold: 5, label: "5 day streak" },
  { id: "streak-7", category: "streak", threshold: 7, label: "7 day streak" },
  { id: "monthly-3", category: "monthly_workout_count", threshold: 3, label: "3 workouts in a month" },
  { id: "volume-1000", category: "total_volume_kg", threshold: 1000, label: "1,000kg lifted" },
  {
    id: "bench-sessions-2",
    category: "exercise_session_count",
    threshold: 2,
    label: "2 bench sessions",
    exercise_id: "barbell-bench-press"
  },
  { id: "pr-count-2", category: "pr_count", threshold: 2, label: "2 PRs" },
  {
    id: "bench-bodyweight",
    category: "bodyweight_ratio",
    threshold: 1,
    label: "Bench bodyweight",
    exercise_id: "barbell-bench-press",
    ratio_multiplier: 1
  },
  {
    id: "squat-1-5x-bodyweight",
    category: "bodyweight_ratio",
    threshold: 1,
    label: "Squat 1.5x bodyweight",
    exercise_id: "barbell-squat",
    ratio_multiplier: 1.5
  }
];

function personalRecord(id: string, exerciseId: string, weight: number) {
  return {
    id,
    user_id: TEST_USER_ID,
    exercise_id: exerciseId,
    weight,
    reps: 5,
    session_id: "s1",
    achieved_at: "2026-01-01T18:00:00.000Z"
  };
}

function completedSession(id: string, endedAtIso: string) {
  return {
    id,
    workout_id: "workout-a",
    user_id: TEST_USER_ID,
    started_at: endedAtIso,
    ended_at: endedAtIso,
    status: "completed",
    workout_name_snapshot: "Full Body A",
    rating: null
  };
}

function setLog(
  id: string,
  sessionId: string,
  workoutExerciseId: string,
  overrides: { reps?: number; weight?: number | null; completedAt?: string } = {}
) {
  return {
    id,
    session_id: sessionId,
    workout_exercise_id: workoutExerciseId,
    set_number: 1,
    reps: overrides.reps ?? 5,
    weight: overrides.weight ?? null,
    completed_at: overrides.completedAt ?? "2026-01-01T18:00:00.000Z",
    exercise_name_snapshot: "Exercise",
    target_reps_snapshot: "5-5",
    target_rest_seconds_snapshot: 60
  };
}

describe("challengesService.getProgress", () => {
  it("returns every badge locked for an account with no completed workouts", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.lifetimeWorkoutCount).toBe(0);
    expect(progress.longestStreakDays).toBe(0);
    expect(progress.badges.every((badge) => !badge.achieved)).toBe(true);
  });

  it("unlocks lifetime-count badges already reached, including history logged before this feature existed", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    seed.workout_sessions = Array.from({ length: 15 }, (_, index) =>
      completedSession(`s${index}`, `2026-01-${String(index + 1).padStart(2, "0")}T18:00:00.000Z`)
    );

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.lifetimeWorkoutCount).toBe(15);
    expect(progress.badges.find((badge) => badge.id === "lifetime-workouts-10")?.achieved).toBe(true);
    expect(progress.badges.find((badge) => badge.id === "lifetime-workouts-50")?.achieved).toBe(false);
  });

  it("keeps a streak badge achieved even after the account's current streak has since reset", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    seed.workout_sessions = [
      // A 5-day run, long over...
      completedSession("s1", "2026-01-01T18:00:00.000Z"),
      completedSession("s2", "2026-01-02T18:00:00.000Z"),
      completedSession("s3", "2026-01-03T18:00:00.000Z"),
      completedSession("s4", "2026-01-04T18:00:00.000Z"),
      completedSession("s5", "2026-01-05T18:00:00.000Z"),
      // ...followed by a single, isolated session much later.
      completedSession("s6", "2026-07-09T18:00:00.000Z")
    ];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.longestStreakDays).toBe(5);
    expect(progress.badges.find((badge) => badge.id === "streak-1")?.achieved).toBe(true);
    expect(progress.badges.find((badge) => badge.id === "streak-3")?.achieved).toBe(true);
    expect(progress.badges.find((badge) => badge.id === "streak-5")?.achieved).toBe(true);
    expect(progress.badges.find((badge) => badge.id === "streak-7")?.achieved).toBe(false);
  });

  it("sorts achieved badges above locked ones", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    seed.workout_sessions = [completedSession("s1", "2026-07-09T18:00:00.000Z")];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();
    const achievedIndexes = progress.badges
      .map((badge, index) => (badge.achieved ? index : -1))
      .filter((index) => index >= 0);
    const lockedIndexes = progress.badges
      .map((badge, index) => (badge.achieved ? -1 : index))
      .filter((index) => index >= 0);

    expect(Math.max(...achievedIndexes)).toBeLessThan(Math.min(...lockedIndexes));
  });

  it("achieves the monthly badge from sessions packed into one calendar month, not spread across months", async () => {
    const packedSeed = baseSeed();
    packedSeed.badges = BADGE_CATALOG;
    packedSeed.workout_sessions = [
      completedSession("s1", "2026-03-01T18:00:00.000Z"),
      completedSession("s2", "2026-03-02T18:00:00.000Z"),
      completedSession("s3", "2026-03-03T18:00:00.000Z")
    ];

    const packedProgress = await createChallengesService(
      createFakeSupabaseClient(packedSeed, TEST_USER_ID)
    ).getProgress();

    expect(packedProgress.badges.find((badge) => badge.id === "monthly-3")?.achieved).toBe(true);

    const spreadSeed = baseSeed();
    spreadSeed.badges = BADGE_CATALOG;
    spreadSeed.workout_sessions = [
      completedSession("s1", "2026-03-01T18:00:00.000Z"),
      completedSession("s2", "2026-04-01T18:00:00.000Z"),
      completedSession("s3", "2026-05-01T18:00:00.000Z")
    ];

    const spreadProgress = await createChallengesService(
      createFakeSupabaseClient(spreadSeed, TEST_USER_ID)
    ).getProgress();

    expect(spreadProgress.badges.find((badge) => badge.id === "monthly-3")?.achieved).toBe(false);
  });

  it("achieves the lifetime volume badge from summed reps*weight, ignoring bodyweight sets", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    seed.workout_sessions = [completedSession("s1", "2026-01-01T18:00:00.000Z")];
    seed.set_logs = [
      setLog("log1", "s1", "we1", { reps: 10, weight: 100 }),
      setLog("log2", "s1", "we1", { reps: 10, weight: null })
    ];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.badges.find((badge) => badge.id === "volume-1000")?.achieved).toBe(true);
  });

  it("counts distinct sessions for an exercise-scoped badge, not total sets", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    seed.workout_exercises = [
      ...seed.workout_exercises,
      {
        id: "we-bench",
        workout_id: "workout-a",
        exercise_id: "barbell-bench-press",
        order_index: 1,
        target_sets: 3,
        target_rep_range_low: 5,
        target_rep_range_high: 5,
        target_rest_seconds: 90,
        target_weight: 60,
        superset_group_id: null
      }
    ];
    seed.workout_sessions = [
      completedSession("s1", "2026-01-01T18:00:00.000Z"),
      completedSession("s2", "2026-01-02T18:00:00.000Z")
    ];
    seed.set_logs = [
      setLog("log1", "s1", "we-bench", { weight: 60 }),
      setLog("log2", "s1", "we-bench", { weight: 62.5 }),
      setLog("log3", "s2", "we-bench", { weight: 60 }),
      setLog("log4", "s2", "we1", { weight: null })
    ];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.badges.find((badge) => badge.id === "bench-sessions-2")?.achieved).toBe(true);
  });

  it("achieves the PR-count badge from the number of recorded personal records", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    seed.personal_records = [
      personalRecord("pr1", "barbell-squat", 60),
      personalRecord("pr2", "barbell-bench-press", 40)
    ];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.badges.find((badge) => badge.id === "pr-count-2")?.achieved).toBe(true);
  });

  it("achieves a bodyweight-ratio badge when the best recorded weight for that exercise clears bodyweight * multiplier", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    // baseSeed's profile bodyweight is 75kg.
    seed.personal_records = [personalRecord("pr1", "barbell-bench-press", 75), personalRecord("pr2", "barbell-squat", 100)];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.badges.find((badge) => badge.id === "bench-bodyweight")?.achieved).toBe(true);
    expect(progress.badges.find((badge) => badge.id === "squat-1-5x-bodyweight")?.achieved).toBe(false);
  });

  it("never errors and never achieves a bodyweight-ratio badge when bodyweight is not on file", async () => {
    const seed = baseSeed();
    seed.badges = BADGE_CATALOG;
    seed.profiles[0] = { ...seed.profiles[0], bodyweight: null };
    seed.personal_records = [personalRecord("pr1", "barbell-bench-press", 200)];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const service = createChallengesService(client);

    const progress = await service.getProgress();

    expect(progress.bodyweight).toBeNull();
    expect(progress.badges.find((badge) => badge.id === "bench-bodyweight")?.achieved).toBe(false);
  });
});
