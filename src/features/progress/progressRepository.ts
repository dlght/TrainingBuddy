import type { SupabaseClient } from "@supabase/supabase-js";

import type { ExerciseHistorySet } from "@/models/session";

type SetLogRow = {
  session_id: string;
  completed_at: string;
  set_number: number;
  reps: number;
  weight: number | null;
  exercise_name_snapshot: string;
};

export function createProgressRepository(client: SupabaseClient) {
  return {
    async getExerciseHistory(exerciseId: string): Promise<ExerciseHistorySet[]> {
      const { data: workoutExerciseRows, error: workoutExerciseError } = await client
        .from("workout_exercises")
        .select("id")
        .eq("exercise_id", exerciseId);

      if (workoutExerciseError) {
        throw workoutExerciseError;
      }

      const workoutExerciseIds = ((workoutExerciseRows ?? []) as { id: string }[]).map((row) => row.id);

      if (workoutExerciseIds.length === 0) {
        return [];
      }

      const { data: setLogRows, error: setLogError } = await client
        .from("set_logs")
        .select("session_id, completed_at, set_number, reps, weight, exercise_name_snapshot")
        .in("workout_exercise_id", workoutExerciseIds);

      if (setLogError) {
        throw setLogError;
      }

      const sessionIds = Array.from(new Set(((setLogRows ?? []) as SetLogRow[]).map((row) => row.session_id)));

      if (sessionIds.length === 0) {
        return [];
      }

      const { data: sessionRows, error: sessionError } = await client
        .from("workout_sessions")
        .select("id, workout_name_snapshot")
        .in("id", sessionIds)
        .eq("status", "completed");

      if (sessionError) {
        throw sessionError;
      }

      const sessionNameById = new Map(
        ((sessionRows ?? []) as { id: string; workout_name_snapshot: string }[]).map((row) => [
          row.id,
          row.workout_name_snapshot
        ])
      );

      return ((setLogRows ?? []) as SetLogRow[])
        .filter((row) => sessionNameById.has(row.session_id))
        .map((row) => ({
          sessionId: row.session_id,
          workoutNameSnapshot: sessionNameById.get(row.session_id) as string,
          completedAt: row.completed_at,
          setNumber: row.set_number,
          reps: row.reps,
          weight: row.weight,
          exerciseNameSnapshot: row.exercise_name_snapshot
        }))
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.setNumber - b.setNumber);
    }
  };
}
