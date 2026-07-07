import type { DatabaseAdapter } from "@/db/client";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";

export type SuggestedWorkout = {
  id: string;
  name: string;
  isFavourite: boolean;
};

export type WorkoutRecommendationService = {
  getSuggestedWorkouts(): Promise<SuggestedWorkout[]>;
};

export function createWorkoutRecommendationService(database: DatabaseAdapter): WorkoutRecommendationService {
  const workoutRepository = createWorkoutRepository(database);

  return {
    async getSuggestedWorkouts(): Promise<SuggestedWorkout[]> {
      const suggested: SuggestedWorkout[] = [];
      const seenIds = new Set<string>();

      // 1. Get top 3 most completed workouts
      const topWorkouts = await workoutRepository.getTopWorkouts(3);
      for (const workout of topWorkouts) {
        if (!seenIds.has(workout.workoutId)) {
          suggested.push({
            id: workout.workoutId,
            name: workout.name,
            isFavourite: false // We'll update this after getting full workout data
          });
          seenIds.add(workout.workoutId);
        }
      }

      // If we have fewer than 3, fill with favourites
      if (suggested.length < 3) {
        const favouriteWorkouts = await workoutRepository.listFavouriteWorkouts();
        for (const workout of favouriteWorkouts) {
          if (suggested.length >= 3) break;
          if (!seenIds.has(workout.id)) {
            suggested.push({
              id: workout.id,
              name: workout.name,
              isFavourite: workout.isFavourite
            });
            seenIds.add(workout.id);
          }
        }
      }

      // If still fewer than 3, fill with seeded workouts (Workout A, B, C)
      if (suggested.length < 3) {
        const seededWorkouts = await workoutRepository.getSeededWorkouts();
        for (const workout of seededWorkouts) {
          if (suggested.length >= 3) break;
          if (!seenIds.has(workout.id)) {
            suggested.push({
              id: workout.id,
              name: workout.name,
              isFavourite: workout.isFavourite
            });
            seenIds.add(workout.id);
          }
        }
      }

      // Update isFavourite for top workouts by fetching full workout data
      for (let i = 0; i < suggested.length; i++) {
        const workout = await workoutRepository.getWorkoutById(suggested[i].id);
        if (workout) {
          suggested[i].isFavourite = workout.isFavourite;
        }
      }

      return suggested;
    }
  };
}

export async function createRuntimeWorkoutRecommendationService(): Promise<WorkoutRecommendationService> {
  const [{ getDatabaseClient }, { runMigrations }, { loadSeedData }] = await Promise.all([
    import("@/db/client"),
    import("@/db/migrate"),
    import("@/db/seed/loadSeedData")
  ]);
  const { adapter } = await getDatabaseClient();

  await runMigrations(adapter);
  await loadSeedData(adapter);

  return createWorkoutRecommendationService(adapter);
}

export const workoutRecommendationService: WorkoutRecommendationService = {
  async getSuggestedWorkouts() {
    return (await createRuntimeWorkoutRecommendationService()).getSuggestedWorkouts();
  }
};
