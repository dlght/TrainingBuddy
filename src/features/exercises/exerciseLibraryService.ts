import type { DatabaseAdapter } from "@/db/client";
import { createExerciseRepository } from "@/db/repositories/exerciseRepository";
import type { Exercise, MuscleGroup, MuscleGroupName } from "@/models/exercise";

import {
  getExercisesForMuscleGroup,
  getFirstAvailableMuscleGroup,
  groupExercisesByMuscleGroup,
  type GroupedExercises,
  sortMuscleGroups
} from "./exerciseSelectors";

export type ExerciseLibraryRepository = ReturnType<typeof createExerciseRepository>;

export type ExerciseLibraryData = {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  groupedExercises: GroupedExercises[];
  defaultMuscleGroupId: MuscleGroupName | null;
};

export type ExerciseLibraryService = {
  getLibraryData(): Promise<ExerciseLibraryData>;
  listExercisesByMuscleGroup(muscleGroupId: MuscleGroupName): Promise<Exercise[]>;
  getExerciseById(exerciseId: string): Promise<Exercise | null>;
};

export function createExerciseLibraryService(
  repository: ExerciseLibraryRepository
): ExerciseLibraryService {
  return {
    async getLibraryData() {
      const [muscleGroups, exercises] = await Promise.all([
        repository.listMuscleGroups(),
        repository.listExercises()
      ]);
      const groupedExercises = groupExercisesByMuscleGroup(exercises, muscleGroups);

      return {
        muscleGroups: sortMuscleGroups(muscleGroups),
        exercises,
        groupedExercises,
        defaultMuscleGroupId: getFirstAvailableMuscleGroup(groupedExercises)
      };
    },

    async listExercisesByMuscleGroup(muscleGroupId) {
      const exercises = await repository.listExercisesByMuscleGroup(muscleGroupId);

      return getExercisesForMuscleGroup(exercises, muscleGroupId);
    },

    getExerciseById(exerciseId) {
      return repository.getExerciseById(exerciseId);
    }
  };
}

export function createExerciseLibraryServiceForDatabase(
  database: DatabaseAdapter
): ExerciseLibraryService {
  return createExerciseLibraryService(createExerciseRepository(database));
}

async function createRuntimeExerciseLibraryService(): Promise<ExerciseLibraryService> {
  const { getReadyDatabaseClient } = await import("@/db/client");
  const { adapter } = await getReadyDatabaseClient();

  return createExerciseLibraryServiceForDatabase(adapter);
}

export const exerciseLibraryService: ExerciseLibraryService = {
  async getLibraryData() {
    return (await createRuntimeExerciseLibraryService()).getLibraryData();
  },

  async listExercisesByMuscleGroup(muscleGroupId) {
    return (await createRuntimeExerciseLibraryService()).listExercisesByMuscleGroup(muscleGroupId);
  },

  async getExerciseById(exerciseId) {
    return (await createRuntimeExerciseLibraryService()).getExerciseById(exerciseId);
  }
};
