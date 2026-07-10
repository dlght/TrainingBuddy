import { createChallengesService } from "@/features/challenges/challengesService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

const BADGE_CATALOG = [
  { id: "lifetime-workouts-10", category: "lifetime_workouts", threshold: 10, label: "10 workouts" },
  { id: "lifetime-workouts-50", category: "lifetime_workouts", threshold: 50, label: "50 workouts" },
  { id: "streak-1", category: "streak", threshold: 1, label: "1 day streak" },
  { id: "streak-3", category: "streak", threshold: 3, label: "3 day streak" },
  { id: "streak-5", category: "streak", threshold: 5, label: "5 day streak" },
  { id: "streak-7", category: "streak", threshold: 7, label: "7 day streak" }
];

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
});
