import type { DatabaseAdapter } from "../client";
import type { ExerciseHistorySet, ExerciseVolumePoint, ExerciseWeightPoint } from "../../models/session";

export function createProgressRepository(database: DatabaseAdapter) {
  return {
    async getExerciseHistory(exerciseId: string): Promise<ExerciseHistorySet[]> {
      return database.getAllAsync<ExerciseHistorySet>(
        `SELECT ws.id as sessionId,
                ws.workout_name_snapshot as workoutNameSnapshot,
                sl.completed_at as completedAt,
                sl.set_number as setNumber,
                sl.reps,
                sl.weight,
                sl.exercise_name_snapshot as exerciseNameSnapshot
           FROM set_logs sl
           JOIN workout_sessions ws ON ws.id = sl.session_id
           JOIN workout_exercises we ON we.id = sl.workout_exercise_id
          WHERE we.exercise_id = ?
            AND ws.status = 'completed'
          ORDER BY sl.completed_at ASC, sl.set_number ASC`,
        [exerciseId]
      );
    },

    async getVolumeBySession(exerciseId: string): Promise<ExerciseVolumePoint[]> {
      return database.getAllAsync<ExerciseVolumePoint>(
        `SELECT ws.id as sessionId,
                max(sl.completed_at) as completedAt,
                sum(sl.reps * sl.weight) as volume
           FROM set_logs sl
           JOIN workout_sessions ws ON ws.id = sl.session_id
           JOIN workout_exercises we ON we.id = sl.workout_exercise_id
          WHERE we.exercise_id = ?
            AND ws.status = 'completed'
          GROUP BY ws.id
          ORDER BY completedAt ASC`,
        [exerciseId]
      );
    },

    async getWeightPoints(exerciseId: string): Promise<ExerciseWeightPoint[]> {
      return database.getAllAsync<ExerciseWeightPoint>(
        `SELECT ws.id as sessionId,
                sl.completed_at as completedAt,
                sl.weight
           FROM set_logs sl
           JOIN workout_sessions ws ON ws.id = sl.session_id
           JOIN workout_exercises we ON we.id = sl.workout_exercise_id
          WHERE we.exercise_id = ?
            AND ws.status = 'completed'
          ORDER BY sl.completed_at ASC`,
        [exerciseId]
      );
    }
  };
}
