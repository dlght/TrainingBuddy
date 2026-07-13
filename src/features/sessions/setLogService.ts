import type { SupabaseClient } from "@supabase/supabase-js";

import { createExerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import { createWorkoutRepository } from "@/features/workouts/workoutRepository";
import { supabase } from "@/lib/supabase";
import { isBodyweightExercise } from "@/models/exercise";
import type { SetLog } from "@/models/session";

import {
  formatSetLogValidationErrors,
  validateSetLogValues,
  type SetLogFormValues
} from "./sessionValidation";
import { createSessionRepository } from "./sessionRepository";

export type LogSetInput = SetLogFormValues & {
  sessionId: string;
  workoutExerciseId: string;
  completedAt?: string;
};

export type SetLogService = {
  logSet(input: LogSetInput): Promise<SetLog>;
  listSetLogs(sessionId: string): Promise<SetLog[]>;
};

export function createSetLogService(client: SupabaseClient): SetLogService {
  const sessionRepository = createSessionRepository(client);
  const workoutRepository = createWorkoutRepository(client);
  const exerciseLibraryService = createExerciseLibraryService(client);

  return {
    async logSet(input) {
      const session = await sessionRepository.getSessionById(input.sessionId);

      if (!session) {
        throw new Error(`Session ${input.sessionId} was not found.`);
      }

      if (session.status !== "active") {
        throw new Error("Sets can only be logged to an active session.");
      }

      const workout = await workoutRepository.getWorkoutWithExercises(session.workoutId);
      const workoutExercise = workout?.exercises.find((exercise) => exercise.id === input.workoutExerciseId);

      if (!workoutExercise) {
        throw new Error("Workout exercise was not found for this session.");
      }

      const setLogs = await sessionRepository.listSetLogs(session.id);
      const nextSetNumber =
        input.setNumber ??
        setLogs.filter((setLog) => setLog.workoutExerciseId === workoutExercise.id).length + 1;
      const exercise = await exerciseLibraryService.getExerciseById(workoutExercise.exerciseId);
      const isBodyweight = isBodyweightExercise(exercise?.equipment);
      const validation = validateSetLogValues(
        {
          setNumber: nextSetNumber,
          reps: input.reps,
          weight: input.weight
        },
        isBodyweight
      );

      if (!validation.isValid || !validation.value) {
        throw new Error(formatSetLogValidationErrors(validation.errors));
      }

      return sessionRepository.addSetLog({
        sessionId: session.id,
        workoutExerciseId: workoutExercise.id,
        setNumber: validation.value.setNumber as number,
        reps: validation.value.reps,
        weight: validation.value.weight,
        completedAt: input.completedAt,
        exerciseNameSnapshot: exercise?.name ?? workoutExercise.exerciseId,
        targetRepsSnapshot: `${workoutExercise.targetRepRangeLow}-${workoutExercise.targetRepRangeHigh}`,
        targetRestSecondsSnapshot: workoutExercise.targetRestSeconds
      });
    },

    listSetLogs(sessionId) {
      return sessionRepository.listSetLogs(sessionId);
    }
  };
}

export const setLogService: SetLogService = createSetLogService(supabase);
