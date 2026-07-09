import { createWorkoutRepository } from "@/features/workouts/workoutRepository";
import { createWorkoutRecommendationService } from "@/features/workouts/workoutRecommendationService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

function completeSession(client: ReturnType<typeof createFakeSupabaseClient>, id: string, workoutId: string, endedAt: string) {
  client.__store.workout_sessions.push({
    id,
    workout_id: workoutId,
    user_id: TEST_USER_ID,
    started_at: endedAt,
    ended_at: endedAt,
    status: "completed",
    workout_name_snapshot: "snapshot",
    rating: null
  });
}

describe("workoutRecommendationService.getSuggestedWorkouts", () => {
  it("prioritizes favourited workouts over top-completed ones, filling remaining slots", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const favA = await repo.createWorkout({ name: "Favourite A", userId: TEST_USER_ID });
    const favB = await repo.createWorkout({ name: "Favourite B", userId: TEST_USER_ID });
    const topC = await repo.createWorkout({ name: "Most Completed C", userId: TEST_USER_ID });
    const topD = await repo.createWorkout({ name: "Second Completed D", userId: TEST_USER_ID });

    await repo.toggleFavourite(favA.id);
    await repo.toggleFavourite(favB.id);

    completeSession(client, "s1", topC.id, "2026-01-01T00:00:00.000Z");
    completeSession(client, "s2", topC.id, "2026-01-02T00:00:00.000Z");
    completeSession(client, "s3", topC.id, "2026-01-03T00:00:00.000Z");
    completeSession(client, "s4", topD.id, "2026-01-04T00:00:00.000Z");

    const service = createWorkoutRecommendationService(client);
    const suggested = await service.getSuggestedWorkouts();

    expect(suggested).toHaveLength(3);
    expect(suggested.filter((workout) => workout.isFavourite).map((workout) => workout.id)).toEqual(
      expect.arrayContaining([favA.id, favB.id])
    );
    expect(suggested.map((workout) => workout.id)).toContain(topC.id);
    expect(suggested.map((workout) => workout.id)).not.toContain(topD.id);
  });

  it("falls back to top-completed/seeded behavior when there are no favourites", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const workout = await repo.createWorkout({ name: "Only Workout", userId: TEST_USER_ID });
    completeSession(client, "s1", workout.id, "2026-01-01T00:00:00.000Z");

    const service = createWorkoutRecommendationService(client);
    const suggested = await service.getSuggestedWorkouts();

    expect(suggested.some((entry) => entry.id === workout.id && !entry.isFavourite)).toBe(true);
  });

  it("removes an un-favourited workout from the suggestions on the next call", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repo = createWorkoutRepository(client);

    const fav = await repo.createWorkout({ name: "Temporarily Favourited", userId: TEST_USER_ID });
    await repo.toggleFavourite(fav.id);

    const service = createWorkoutRecommendationService(client);
    const withFavourite = await service.getSuggestedWorkouts();
    expect(withFavourite.map((entry) => entry.id)).toContain(fav.id);

    await repo.toggleFavourite(fav.id);

    const withoutFavourite = await service.getSuggestedWorkouts();
    expect(withoutFavourite.find((entry) => entry.id === fav.id)?.isFavourite).not.toBe(true);
  });
});
