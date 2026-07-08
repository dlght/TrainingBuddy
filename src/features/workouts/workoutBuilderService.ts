import type { DatabaseAdapter } from "@/db/client";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";
import type { WorkoutWithExercises } from "@/models/workout";

import {
  formatWorkoutValidationErrors,
  validateWorkoutDraft,
  type WorkoutDraftValues
} from "./workoutValidation";

const LOCAL_USER_ID = "local-user";

export type WorkoutBuilderRepository = ReturnType<typeof createWorkoutRepository>;

export type WorkoutBuilderService = {
  getWorkout(workoutId: string): Promise<WorkoutWithExercises | null>;
  createCustomWorkout(values: WorkoutDraftValues, userId?: string): Promise<WorkoutWithExercises>;
  updateCustomWorkout(workoutId: string, values: WorkoutDraftValues): Promise<WorkoutWithExercises>;
  deleteCustomWorkout(workoutId: string): Promise<void>;
  copyTemplateWorkout(templateWorkoutId: string, userId?: string): Promise<WorkoutWithExercises>;
};

function validatedWorkout(values: WorkoutDraftValues) {
  const result = validateWorkoutDraft(values);

  if (!result.isValid || !result.value) {
    throw new Error(formatWorkoutValidationErrors(result.errors));
  }

  return result.value;
}

export function createWorkoutBuilderService(repository: WorkoutBuilderRepository): WorkoutBuilderService {
  return {
    getWorkout(workoutId) {
      return repository.getWorkoutWithExercises(workoutId);
    },

    createCustomWorkout(values, userId = LOCAL_USER_ID) {
      const workout = validatedWorkout(values);

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

    copyTemplateWorkout(templateWorkoutId, userId = LOCAL_USER_ID) {
      return repository.copyTemplateWorkout(templateWorkoutId, userId);
    }
  };
}

export function createWorkoutBuilderServiceForDatabase(database: DatabaseAdapter): WorkoutBuilderService {
  return createWorkoutBuilderService(createWorkoutRepository(database));
}

async function createRuntimeWorkoutBuilderService(): Promise<WorkoutBuilderService> {
  const { getReadyDatabaseClient } = await import("@/db/client");
  const { adapter } = await getReadyDatabaseClient();

  return createWorkoutBuilderServiceForDatabase(adapter);
}

export const workoutBuilderService: WorkoutBuilderService = {
  async getWorkout(workoutId) {
    return (await createRuntimeWorkoutBuilderService()).getWorkout(workoutId);
  },

  async createCustomWorkout(values, userId) {
    return (await createRuntimeWorkoutBuilderService()).createCustomWorkout(values, userId);
  },

  async updateCustomWorkout(workoutId, values) {
    return (await createRuntimeWorkoutBuilderService()).updateCustomWorkout(workoutId, values);
  },

  async deleteCustomWorkout(workoutId) {
    return (await createRuntimeWorkoutBuilderService()).deleteCustomWorkout(workoutId);
  },

  async copyTemplateWorkout(templateWorkoutId, userId) {
    return (await createRuntimeWorkoutBuilderService()).copyTemplateWorkout(templateWorkoutId, userId);
  }
};
