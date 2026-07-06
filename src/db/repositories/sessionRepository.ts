import type { DatabaseAdapter } from "../client";
import type { CreateSetLogInput, SetLog, WorkoutSession, WorkoutSessionStatus } from "../../models/session";
import { createLocalId } from "../../utils/ids";

export type StartSessionInput = {
  workoutId: string;
  userId: string;
  workoutNameSnapshot: string;
  startedAt?: string;
};

type WorkoutSessionRow = WorkoutSession;

export function createSessionRepository(database: DatabaseAdapter) {
  return {
    async getSessionById(sessionId: string): Promise<WorkoutSession | null> {
      return database.getFirstAsync<WorkoutSessionRow>(
        `SELECT id,
                workout_id as workoutId,
                user_id as userId,
                started_at as startedAt,
                ended_at as endedAt,
                status,
                workout_name_snapshot as workoutNameSnapshot
           FROM workout_sessions
          WHERE id = ?
          LIMIT 1`,
        [sessionId]
      );
    },

    async getActiveSession(userId: string): Promise<WorkoutSession | null> {
      return database.getFirstAsync<WorkoutSessionRow>(
        `SELECT id,
                workout_id as workoutId,
                user_id as userId,
                started_at as startedAt,
                ended_at as endedAt,
                status,
                workout_name_snapshot as workoutNameSnapshot
           FROM workout_sessions
          WHERE user_id = ?
            AND status = 'active'
          ORDER BY started_at DESC
          LIMIT 1`,
        [userId]
      );
    },

    async startSession(input: StartSessionInput): Promise<WorkoutSession> {
      const existing = await this.getActiveSession(input.userId);

      if (existing) {
        throw new Error("An active workout session already exists.");
      }

      const session: WorkoutSession = {
        id: createLocalId("session"),
        workoutId: input.workoutId,
        userId: input.userId,
        startedAt: input.startedAt ?? new Date().toISOString(),
        endedAt: null,
        status: "active",
        workoutNameSnapshot: input.workoutNameSnapshot
      };

      await database.runAsync(
        `INSERT INTO workout_sessions (
            id,
            workout_id,
            user_id,
            started_at,
            ended_at,
            status,
            workout_name_snapshot
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.workoutId,
          session.userId,
          session.startedAt,
          session.endedAt,
          session.status,
          session.workoutNameSnapshot
        ]
      );

      return session;
    },

    async updateSessionStatus(
      sessionId: string,
      status: Extract<WorkoutSessionStatus, "completed" | "discarded">,
      endedAt = new Date().toISOString()
    ): Promise<void> {
      await database.runAsync(
        "UPDATE workout_sessions SET status = ?, ended_at = ? WHERE id = ? AND status = 'active'",
        [status, endedAt, sessionId]
      );
    },

    async addSetLog(input: CreateSetLogInput): Promise<SetLog> {
      const setLog: SetLog = {
        ...input,
        id: input.id ?? createLocalId("set"),
        completedAt: input.completedAt ?? new Date().toISOString()
      };

      await database.runAsync(
        `INSERT INTO set_logs (
            id,
            session_id,
            workout_exercise_id,
            set_number,
            reps,
            weight,
            effort_rpe,
            completed_at,
            exercise_name_snapshot,
            target_reps_snapshot,
            target_rest_seconds_snapshot
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          setLog.id,
          setLog.sessionId,
          setLog.workoutExerciseId,
          setLog.setNumber,
          setLog.reps,
          setLog.weight,
          setLog.effortRpe,
          setLog.completedAt,
          setLog.exerciseNameSnapshot,
          setLog.targetRepsSnapshot,
          setLog.targetRestSecondsSnapshot
        ]
      );

      return setLog;
    },

    async listSetLogs(sessionId: string): Promise<SetLog[]> {
      return database.getAllAsync<SetLog>(
        `SELECT id,
                session_id as sessionId,
                workout_exercise_id as workoutExerciseId,
                set_number as setNumber,
                reps,
                weight,
                effort_rpe as effortRpe,
                completed_at as completedAt,
                exercise_name_snapshot as exerciseNameSnapshot,
                target_reps_snapshot as targetRepsSnapshot,
                target_rest_seconds_snapshot as targetRestSecondsSnapshot
           FROM set_logs
          WHERE session_id = ?
          ORDER BY completed_at ASC, set_number ASC`,
        [sessionId]
      );
    }
  };
}
