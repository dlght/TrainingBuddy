import type { SupabaseClient } from "@supabase/supabase-js";

import { createExerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import { createWorkoutRepository } from "@/features/workouts/workoutRepository";
import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";
import { isBodyweightExercise, type Exercise } from "@/models/exercise";
import type { SetLog, WorkoutSession } from "@/models/session";
import type { WorkoutExercise, WorkoutWithExercises } from "@/models/workout";

import { createSessionRepository } from "./sessionRepository";

export type ActiveSessionExercise = WorkoutExercise & {
  exerciseName: string;
  loggedSetCount: number;
  isBodyweight: boolean;
};

export type ActiveSessionDetails = {
  session: WorkoutSession;
  workout: WorkoutWithExercises;
  exercises: ActiveSessionExercise[];
  setLogs: SetLog[];
};

export type SessionService = {
  getSessionDetails(sessionId: string): Promise<ActiveSessionDetails>;
  getActiveSession(): Promise<ActiveSessionDetails | null>;
  resumeActiveSession(): Promise<ActiveSessionDetails | null>;
  pauseActiveSession(sessionId: string): Promise<void>;
  startWorkoutSession(workoutId: string): Promise<ActiveSessionDetails>;
  completeSession(
    sessionId: string,
    options?: { rating?: number | null; endedAt?: string }
  ): Promise<ActiveSessionDetails>;
  discardSession(sessionId: string): Promise<void>;
};

function countLoggedSets(setLogs: SetLog[], workoutExerciseId: string): number {
  return setLogs.filter((setLog) => setLog.workoutExerciseId === workoutExerciseId).length;
}

export function createSessionService(client: SupabaseClient): SessionService {
  const sessionRepository = createSessionRepository(client);
  const workoutRepository = createWorkoutRepository(client);
  const exerciseLibraryService = createExerciseLibraryService(client);

  async function hydrateSessionDetails(session: WorkoutSession): Promise<ActiveSessionDetails> {
    const workout = await workoutRepository.getWorkoutWithExercises(session.workoutId);

    if (!workout) {
      throw new Error(`Workout ${session.workoutId} was not found for the active session.`);
    }

    const setLogs = await sessionRepository.listSetLogs(session.id);
    const exerciseRows = await Promise.all(
      workout.exercises.map((workoutExercise) => exerciseLibraryService.getExerciseById(workoutExercise.exerciseId))
    );
    const exercisesById = new Map<string, Exercise>(
      exerciseRows
        .filter((exercise): exercise is Exercise => exercise !== null)
        .map((exercise) => [exercise.id, exercise])
    );

    return {
      session,
      workout,
      setLogs,
      exercises: workout.exercises.map((workoutExercise) => ({
        ...workoutExercise,
        exerciseName: exercisesById.get(workoutExercise.exerciseId)?.name ?? workoutExercise.exerciseId,
        loggedSetCount: countLoggedSets(setLogs, workoutExercise.id),
        isBodyweight: isBodyweightExercise(exercisesById.get(workoutExercise.exerciseId)?.equipment)
      }))
    };
  }

  return {
    async getSessionDetails(sessionId) {
      const session = await sessionRepository.getSessionById(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} was not found.`);
      }

      return hydrateSessionDetails(session);
    },

    async getActiveSession() {
      const userId = await requireUserId(client);
      const activeSession = await sessionRepository.getActiveSession(userId);

      if (!activeSession) {
        return null;
      }

      return hydrateSessionDetails(activeSession);
    },

    async resumeActiveSession() {
      const userId = await requireUserId(client);
      const activeSession = await sessionRepository.getActiveSession(userId);

      if (!activeSession) {
        return null;
      }

      if (activeSession.status === "paused") {
        await sessionRepository.resumeSession(activeSession.id);
      }

      return this.getSessionDetails(activeSession.id);
    },

    async pauseActiveSession(sessionId: string): Promise<void> {
      await sessionRepository.pauseSession(sessionId);
    },

    async startWorkoutSession(workoutId) {
      const userId = await requireUserId(client);
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

      return hydrateSessionDetails(session);
    },

    async completeSession(sessionId, options = {}) {
      const session = await sessionRepository.getSessionById(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} was not found.`);
      }

      if (session.status !== "active") {
        throw new Error("Only active sessions can be completed.");
      }

      await sessionRepository.completeSession(session.id, {
        rating: options.rating ?? null,
        endedAt: options.endedAt
      });

      return this.getSessionDetails(session.id);
    },

    async discardSession(sessionId) {
      const session = await sessionRepository.getSessionById(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} was not found.`);
      }

      if (session.status !== "active" && session.status !== "paused") {
        return;
      }

      await sessionRepository.updateSessionStatus(session.id, "discarded");
    }
  };
}

export const sessionService: SessionService = createSessionService(supabase);
