import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { WorkoutWithExercises } from "@/models/workout";

import { createWorkoutRepository } from "./workoutRepository";

export type WorkoutListData = {
  sampleWorkouts: WorkoutWithExercises[];
  customWorkouts: WorkoutWithExercises[];
};

export type WorkoutListService = {
  listWorkouts(): Promise<WorkoutListData>;
};

export function createWorkoutListService(client: SupabaseClient): WorkoutListService {
  const repository = createWorkoutRepository(client);

  return {
    async listWorkouts() {
      const workouts = await repository.listWorkouts();
      const workoutsWithExercises = await Promise.all(
        workouts.map((workout) => repository.getWorkoutWithExercises(workout.id))
      );
      const loadedWorkouts = workoutsWithExercises.filter(
        (workout): workout is WorkoutWithExercises => workout !== null
      );

      return {
        sampleWorkouts: loadedWorkouts.filter((workout) => workout.isTemplate),
        customWorkouts: loadedWorkouts.filter((workout) => !workout.isTemplate)
      };
    }
  };
}

export const workoutListService: WorkoutListService = createWorkoutListService(supabase);
