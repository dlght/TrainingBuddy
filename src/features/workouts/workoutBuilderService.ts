import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";
import type { Workout, WorkoutWithExercises } from "@/models/workout";

import {
  formatWorkoutValidationErrors,
  validateWorkoutDraft,
  type WorkoutDraftValues
} from "./workoutValidation";
import { createWorkoutRepository } from "./workoutRepository";

export type WorkoutBuilderService = {
  getWorkout(workoutId: string): Promise<WorkoutWithExercises | null>;
  createCustomWorkout(values: WorkoutDraftValues): Promise<WorkoutWithExercises>;
  updateCustomWorkout(workoutId: string, values: WorkoutDraftValues): Promise<WorkoutWithExercises>;
  deleteCustomWorkout(workoutId: string): Promise<void>;
  copyTemplateWorkout(templateWorkoutId: string): Promise<WorkoutWithExercises>;
  toggleFavourite(workoutId: string): Promise<Workout>;
};

function validatedWorkout(values: WorkoutDraftValues) {
  const result = validateWorkoutDraft(values);

  if (!result.isValid || !result.value) {
    throw new Error(formatWorkoutValidationErrors(result.errors));
  }

  return result.value;
}

export function createWorkoutBuilderService(client: SupabaseClient): WorkoutBuilderService {
  const repository = createWorkoutRepository(client);

  return {
    getWorkout(workoutId) {
      return repository.getWorkoutWithExercises(workoutId);
    },

    async createCustomWorkout(values) {
      const workout = validatedWorkout(values);
      const userId = await requireUserId(client);

      return repository.createWorkout({
        name: workout.name,
        userId,
        exercises: workout.exercises
      });
    },

    updateCustomWorkout(workoutId, values) {
      const workout = validatedWorkout(values);

      return repository.updateWorkout(workoutId, workout);
    },

    deleteCustomWorkout(workoutId) {
      return repository.deleteWorkout(workoutId);
    },

    async copyTemplateWorkout(templateWorkoutId) {
      const userId = await requireUserId(client);

      return repository.copyTemplateWorkout(templateWorkoutId, userId);
    },

    toggleFavourite(workoutId) {
      return repository.toggleFavourite(workoutId);
    }
  };
}

export const workoutBuilderService: WorkoutBuilderService = createWorkoutBuilderService(supabase);
