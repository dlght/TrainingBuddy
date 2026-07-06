import type { DatabaseAdapter } from "@/db/client";
import { createExerciseRepository } from "@/db/repositories/exerciseRepository";
import { createProgressRepository } from "@/db/repositories/progressRepository";
import type { Exercise } from "@/models/exercise";
import type { ExerciseHistorySet, ExerciseVolumePoint, ExerciseWeightPoint } from "@/models/session";

import {
  calculateVolumeBySession,
  calculateWeightTrendPoints,
  groupHistorySetsBySession,
  type SessionHistorySummary
} from "./progressCalculations";

export type ProgressRepository = ReturnType<typeof createProgressRepository>;
export type ProgressExerciseRepository = ReturnType<typeof createExerciseRepository>;

export type ExerciseProgressData = {
  exercise: Exercise | null;
  historySets: ExerciseHistorySet[];
  sessions: SessionHistorySummary[];
  volumePoints: ExerciseVolumePoint[];
  weightPoints: ExerciseWeightPoint[];
};

export type ProgressService = {
  getExerciseProgress(exerciseId: string): Promise<ExerciseProgressData>;
};

export function createProgressService(
  progressRepository: ProgressRepository,
  exerciseRepository: ProgressExerciseRepository
): ProgressService {
  return {
    async getExerciseProgress(exerciseId) {
      const [exercise, historySets] = await Promise.all([
        exerciseRepository.getExerciseById(exerciseId),
        progressRepository.getExerciseHistory(exerciseId)
      ]);

      return {
        exercise,
        historySets,
        sessions: groupHistorySetsBySession(historySets),
        volumePoints: calculateVolumeBySession(historySets),
        weightPoints: calculateWeightTrendPoints(historySets)
      };
    }
  };
}

export function createProgressServiceForDatabase(database: DatabaseAdapter): ProgressService {
  return createProgressService(createProgressRepository(database), createExerciseRepository(database));
}

async function createRuntimeProgressService(): Promise<ProgressService> {
  const [
    { getDatabaseClient },
    { runMigrations },
    { loadSeedData }
  ] = await Promise.all([
    import("@/db/client"),
    import("@/db/migrate"),
    import("@/db/seed/loadSeedData")
  ]);
  const { adapter } = await getDatabaseClient();

  await runMigrations(adapter);
  await loadSeedData(adapter);

  return createProgressServiceForDatabase(adapter);
}

export const progressService: ProgressService = {
  async getExerciseProgress(exerciseId) {
    return (await createRuntimeProgressService()).getExerciseProgress(exerciseId);
  }
};
