import type { DatabaseAdapter } from "@/db/client";
import { createExerciseRepository } from "@/db/repositories/exerciseRepository";
import { createSessionRepository } from "@/db/repositories/sessionRepository";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";
import type { SetLog } from "@/models/session";

import {
  formatSetLogValidationErrors,
  validateSetLogValues,
  type SetLogFormValues
} from "./sessionValidation";

export type SetLogRepository = ReturnType<typeof createSessionRepository>;
export type SetLogWorkoutRepository = ReturnType<typeof createWorkoutRepository>;
export type SetLogExerciseRepository = ReturnType<typeof createExerciseRepository>;

export type LogSetInput = SetLogFormValues & {
  sessionId: string;
  workoutExerciseId: string;
  completedAt?: string;
};

export type SetLogService = {
  logSet(input: LogSetInput): Promise<SetLog>;
  listSetLogs(sessionId: string): Promise<SetLog[]>;
};

export function createSetLogService(
  sessionRepository: SetLogRepository,
  workoutRepository: SetLogWorkoutRepository,
  exerciseRepository: SetLogExerciseRepository
): SetLogService {
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
      const exercise = await exerciseRepository.getExerciseById(workoutExercise.exerciseId);
      const isBodyweight = exercise?.equipment === "bodyweight";
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

export function createSetLogServiceForDatabase(database: DatabaseAdapter): SetLogService {
  return createSetLogService(
    createSessionRepository(database),
    createWorkoutRepository(database),
    createExerciseRepository(database)
  );
}

async function createRuntimeSetLogService(): Promise<SetLogService> {
  const { getReadyDatabaseClient } = await import("@/db/client");
  const { adapter } = await getReadyDatabaseClient();

  return createSetLogServiceForDatabase(adapter);
}

export const setLogService: SetLogService = {
  async logSet(input) {
    return (await createRuntimeSetLogService()).logSet(input);
  },

  async listSetLogs(sessionId) {
    return (await createRuntimeSetLogService()).listSetLogs(sessionId);
  }
};
