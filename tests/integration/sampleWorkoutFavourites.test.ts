import { createWorkoutRepository } from "@/features/workouts/workoutRepository";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

const OTHER_USER_ID = "u2";

describe("workoutRepository sample workout favourites", () => {
  it("toggling a sample workout's favourite round-trips for the caller's account", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repository = createWorkoutRepository(client);

    const before = await repository.getWorkoutById("workout-a");
    expect(before?.isFavourite).toBe(false);

    const favourited = await repository.toggleFavourite("workout-a");
    expect(favourited.isFavourite).toBe(true);

    const unfavourited = await repository.toggleFavourite("workout-a");
    expect(unfavourited.isFavourite).toBe(false);
  });

  it("does not leak one account's sample-workout favourite to another account", async () => {
    const seed = baseSeed();

    seed.sample_workout_favourites = [
      { user_id: TEST_USER_ID, workout_id: "workout-a", created_at: "2026-01-01T00:00:00.000Z" }
    ];

    const clientA = createFakeSupabaseClient(seed, TEST_USER_ID);
    const clientB = createFakeSupabaseClient(seed, OTHER_USER_ID);

    const repositoryA = createWorkoutRepository(clientA);
    const repositoryB = createWorkoutRepository(clientB);

    const asA = await repositoryA.getWorkoutById("workout-a");
    const asB = await repositoryB.getWorkoutById("workout-a");

    expect(asA?.isFavourite).toBe(true);
    expect(asB?.isFavourite).toBe(false);
  });

  it("still favourites a custom (non-template) workout via the existing column", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const repository = createWorkoutRepository(client);

    const custom = await repository.createWorkout({
      name: "My Custom Workout",
      userId: TEST_USER_ID,
      exercises: []
    });

    const favourited = await repository.toggleFavourite(custom.id);
    expect(favourited.isFavourite).toBe(true);

    const favourites = await repository.listFavouriteWorkouts();
    expect(favourites.map((workout) => workout.id)).toContain(custom.id);
  });

  it("includes favourited sample workouts in listFavouriteWorkouts alongside favourited custom workouts", async () => {
    const seed = baseSeed();

    seed.sample_workout_favourites = [
      { user_id: TEST_USER_ID, workout_id: "workout-a", created_at: "2026-01-01T00:00:00.000Z" }
    ];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const repository = createWorkoutRepository(client);

    const favourites = await repository.listFavouriteWorkouts();

    expect(favourites.map((workout) => workout.id)).toEqual(["workout-a"]);
    expect(favourites[0].isFavourite).toBe(true);
  });

  it("reflects per-account favourite state in listWorkouts and getSeededWorkouts", async () => {
    const seed = baseSeed();

    seed.sample_workout_favourites = [
      { user_id: TEST_USER_ID, workout_id: "workout-a", created_at: "2026-01-01T00:00:00.000Z" }
    ];

    const client = createFakeSupabaseClient(seed, TEST_USER_ID);
    const repository = createWorkoutRepository(client);

    const all = await repository.listWorkouts();
    const seeded = await repository.getSeededWorkouts();

    expect(all.find((workout) => workout.id === "workout-a")?.isFavourite).toBe(true);
    expect(seeded.find((workout) => workout.id === "workout-a")?.isFavourite).toBe(true);
  });
});
