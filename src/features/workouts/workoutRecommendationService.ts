import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import { createWorkoutRepository } from "./workoutRepository";

export type SuggestedWorkout = {
  id: string;
  name: string;
  isFavourite: boolean;
};

export type WorkoutRecommendationService = {
  getSuggestedWorkouts(): Promise<SuggestedWorkout[]>;
};

export function createWorkoutRecommendationService(client: SupabaseClient): WorkoutRecommendationService {
  const workoutRepository = createWorkoutRepository(client);

  return {
    async getSuggestedWorkouts(): Promise<SuggestedWorkout[]> {
      const suggested: SuggestedWorkout[] = [];
      const seenIds = new Set<string>();

      // 1. Favourited workouts take priority so they "pop" on the dashboard,
      // in the order listFavouriteWorkouts() returns (most recently created first).
      const favouriteWorkouts = await workoutRepository.listFavouriteWorkouts();
      for (const workout of favouriteWorkouts) {
        if (suggested.length >= 3) break;
        if (!seenIds.has(workout.id)) {
          suggested.push({
            id: workout.id,
            name: workout.name,
            isFavourite: true
          });
          seenIds.add(workout.id);
        }
      }

      // 2. Fill remaining slots with the top 3 most completed workouts.
      if (suggested.length < 3) {
        const topWorkouts = await workoutRepository.getTopWorkouts(3);
        for (const workout of topWorkouts) {
          if (suggested.length >= 3) break;
          if (!seenIds.has(workout.workoutId)) {
            suggested.push({
              id: workout.workoutId,
              name: workout.name,
              isFavourite: false // We'll update this after getting full workout data
            });
            seenIds.add(workout.workoutId);
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

export const workoutRecommendationService: WorkoutRecommendationService =
  createWorkoutRecommendationService(supabase);
