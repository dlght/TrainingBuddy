import type { SupabaseClient } from "@supabase/supabase-js";

import { createExerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/models/exercise";
import type { ExerciseHistorySet, ExerciseVolumePoint, ExerciseWeightPoint } from "@/models/session";

import {
  calculateVolumeBySession,
  calculateWeightTrendPoints,
  groupHistorySetsBySession,
  type SessionHistorySummary
} from "./progressCalculations";
import { createProgressRepository } from "./progressRepository";

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

export function createProgressService(client: SupabaseClient): ProgressService {
  const progressRepository = createProgressRepository(client);
  const exerciseLibraryService = createExerciseLibraryService(client);

  return {
    async getExerciseProgress(exerciseId) {
      const [exercise, historySets] = await Promise.all([
        exerciseLibraryService.getExerciseById(exerciseId),
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

export const progressService: ProgressService = createProgressService(supabase);
