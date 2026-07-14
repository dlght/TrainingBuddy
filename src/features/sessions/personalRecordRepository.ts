import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonalRecordInsert = {
  id: string;
  userId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  sessionId: string;
  achievedAt: string;
};

export function createPersonalRecordRepository(client: SupabaseClient) {
  return {
    async getBestWeightsByExercise(userId: string, exerciseIds: string[]): Promise<Map<string, number>> {
      if (exerciseIds.length === 0) {
        return new Map();
      }

      const { data, error } = await client
        .from("personal_records")
        .select("exercise_id, weight")
        .eq("user_id", userId)
        .in("exercise_id", exerciseIds);

      if (error) {
        throw error;
      }

      const bestByExercise = new Map<string, number>();

      for (const row of (data ?? []) as { exercise_id: string; weight: number }[]) {
        const current = bestByExercise.get(row.exercise_id);

        if (current === undefined || row.weight > current) {
          bestByExercise.set(row.exercise_id, row.weight);
        }
      }

      return bestByExercise;
    },

    async insertPersonalRecords(records: PersonalRecordInsert[]): Promise<void> {
      if (records.length === 0) {
        return;
      }

      const { error } = await client.from("personal_records").insert(
        records.map((record) => ({
          id: record.id,
          user_id: record.userId,
          exercise_id: record.exerciseId,
          weight: record.weight,
          reps: record.reps,
          session_id: record.sessionId,
          achieved_at: record.achievedAt
        }))
      );

      if (error) {
        throw error;
      }
    },

    async listPersonalRecords(userId: string): Promise<{ exerciseId: string; weight: number }[]> {
      const { data, error } = await client.from("personal_records").select("exercise_id, weight").eq("user_id", userId);

      if (error) {
        throw error;
      }

      return ((data ?? []) as { exercise_id: string; weight: number }[]).map((row) => ({
        exerciseId: row.exercise_id,
        weight: row.weight
      }));
    }
  };
}
