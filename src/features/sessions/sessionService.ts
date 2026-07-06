import type { DatabaseAdapter } from "@/db/client";
import { createExerciseRepository } from "@/db/repositories/exerciseRepository";
import { createSessionRepository } from "@/db/repositories/sessionRepository";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";
import type { Exercise } from "@/models/exercise";
import type { SetLog, WorkoutSession } from "@/models/session";
import type { WorkoutExercise, WorkoutWithExercises } from "@/models/workout";

const LOCAL_USER_ID = "local-user";

export type SessionRepository = ReturnType<typeof createSessionRepository>;
export type SessionWorkoutRepository = ReturnType<typeof createWorkoutRepository>;
export type SessionExerciseRepository = ReturnType<typeof createExerciseRepository>;

export type ActiveSessionExercise = WorkoutExercise & {
  exerciseName: string;
  loggedSetCount: number;
};

export type ActiveSessionDetails = {
  session: WorkoutSession;
  workout: WorkoutWithExercises;
  exercises: ActiveSessionExercise[];
  setLogs: SetLog[];
};

export type SessionService = {
  getSessionDetails(sessionId: string): Promise<ActiveSessionDetails>;
  getActiveSession(userId?: string): Promise<ActiveSessionDetails | null>;
  resumeActiveSession(userId?: string): Promise<ActiveSessionDetails | null>;
  startWorkoutSession(workoutId: string, userId?: string): Promise<ActiveSessionDetails>;
  completeSession(sessionId: string): Promise<ActiveSessionDetails>;
  discardSession(sessionId: string): Promise<void>;
};

function countLoggedSets(setLogs: SetLog[], workoutExerciseId: string): number {
  return setLogs.filter((setLog) => setLog.workoutExerciseId === workoutExerciseId).length;
}

async function hydrateSessionDetails(
  session: WorkoutSession,
  workoutRepository: SessionWorkoutRepository,
  exerciseRepository: SessionExerciseRepository,
  sessionRepository: SessionRepository
): Promise<ActiveSessionDetails> {
  const workout = await workoutRepository.getWorkoutWithExercises(session.workoutId);

  if (!workout) {
    throw new Error(`Workout ${session.workoutId} was not found for the active session.`);
  }

  const setLogs = await sessionRepository.listSetLogs(session.id);
  const exerciseRows = await Promise.all(
    workout.exercises.map((workoutExercise) => exerciseRepository.getExerciseById(workoutExercise.exerciseId))
  );
  const exercisesById = new Map<string, Exercise>(
    exerciseRows.filter((exercise): exercise is Exercise => exercise !== null).map((exercise) => [exercise.id, exercise])
  );

  return {
    session,
    workout,
    setLogs,
    exercises: workout.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      exerciseName: exercisesById.get(workoutExercise.exerciseId)?.name ?? workoutExercise.exerciseId,
      loggedSetCount: countLoggedSets(setLogs, workoutExercise.id)
    }))
  };
}

export function createSessionService(
  sessionRepository: SessionRepository,
  workoutRepository: SessionWorkoutRepository,
  exerciseRepository: SessionExerciseRepository
): SessionService {
  return {
    async getSessionDetails(sessionId) {
      const session = await sessionRepository.getSessionById(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} was not found.`);
      }

      return hydrateSessionDetails(session, workoutRepository, exerciseRepository, sessionRepository);
    },

    async getActiveSession(userId = LOCAL_USER_ID) {
      const activeSession = await sessionRepository.getActiveSession(userId);

      if (!activeSession) {
        return null;
      }

      return hydrateSessionDetails(activeSession, workoutRepository, exerciseRepository, sessionRepository);
    },

    resumeActiveSession(userId = LOCAL_USER_ID) {
      return this.getActiveSession(userId);
    },

    async startWorkoutSession(workoutId, userId = LOCAL_USER_ID) {
      const existingSession = await sessionRepository.getActiveSession(userId);

      if (existingSession) {
        throw new Error("Resume or discard the active workout session before starting another.");
      }

      const workout = await workoutRepository.getWorkoutWithExercises(workoutId);

      if (!workout) {
        throw new Error(`Workout ${workoutId} was not found.`);
      }

      if (workout.exercises.length === 0) {
        throw new Error("Add exercises before starting this workout.");
      }

      const session = await sessionRepository.startSession({
        workoutId: workout.id,
        userId,
        workoutNameSnapshot: workout.name
      });

      return hydrateSessionDetails(session, workoutRepository, exerciseRepository, sessionRepository);
    },

    async completeSession(sessionId) {
      const session = await sessionRepository.getSessionById(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} was not found.`);
      }

      if (session.status !== "active") {
        throw new Error("Only active sessions can be completed.");
      }

      const setLogs = await sessionRepository.listSetLogs(session.id);

      if (setLogs.length === 0) {
        throw new Error("Log at least one set before finishing.");
      }

      await sessionRepository.updateSessionStatus(session.id, "completed");

      return this.getSessionDetails(session.id);
    },

    async discardSession(sessionId) {
      const session = await sessionRepository.getSessionById(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} was not found.`);
      }

      if (session.status !== "active") {
        return;
      }

      await sessionRepository.updateSessionStatus(session.id, "discarded");
    }
  };
}

export function createSessionServiceForDatabase(database: DatabaseAdapter): SessionService {
  return createSessionService(
    createSessionRepository(database),
    createWorkoutRepository(database),
    createExerciseRepository(database)
  );
}

async function createRuntimeSessionService(): Promise<SessionService> {
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

  return createSessionServiceForDatabase(adapter);
}

export const sessionService: SessionService = {
  async getSessionDetails(sessionId) {
    return (await createRuntimeSessionService()).getSessionDetails(sessionId);
  },

  async getActiveSession(userId) {
    return (await createRuntimeSessionService()).getActiveSession(userId);
  },

  async resumeActiveSession(userId) {
    return (await createRuntimeSessionService()).resumeActiveSession(userId);
  },

  async startWorkoutSession(workoutId, userId) {
    return (await createRuntimeSessionService()).startWorkoutSession(workoutId, userId);
  },

  async completeSession(sessionId) {
    return (await createRuntimeSessionService()).completeSession(sessionId);
  },

  async discardSession(sessionId) {
    return (await createRuntimeSessionService()).discardSession(sessionId);
  }
};
