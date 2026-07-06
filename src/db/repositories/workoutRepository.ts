import type { DatabaseAdapter } from "../client";
import type {
  CreateWorkoutInput,
  SeedWorkout,
  Workout,
  WorkoutExercise,
  WorkoutExerciseSeed,
  WorkoutWithExercises
} from "../../models/workout";
import { runInTransaction } from "../migrate";
import { createLocalId } from "../../utils/ids";

type WorkoutRow = Omit<Workout, "isTemplate"> & {
  isTemplate: number | boolean;
};

function toWorkout(row: WorkoutRow): Workout {
  return {
    ...row,
    isTemplate: Boolean(row.isTemplate)
  };
}

async function insertWorkoutExercises(
  database: DatabaseAdapter,
  workoutId: string,
  exercises: WorkoutExerciseSeed[]
): Promise<void> {
  for (const exercise of exercises) {
    await database.runAsync(
      `INSERT INTO workout_exercises (
          id,
          workout_id,
          exercise_id,
          order_index,
          target_sets,
          target_rep_range_low,
          target_rep_range_high,
          target_rest_seconds,
          superset_group_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createLocalId("workout_exercise"),
        workoutId,
        exercise.exerciseId,
        exercise.orderIndex,
        exercise.targetSets,
        exercise.targetRepRangeLow,
        exercise.targetRepRangeHigh,
        exercise.targetRestSeconds,
        exercise.supersetGroupId
      ]
    );
  }
}

export function createWorkoutRepository(database: DatabaseAdapter) {
  return {
    async listWorkouts(): Promise<Workout[]> {
      const rows = await database.getAllAsync<WorkoutRow>(
        `SELECT id,
                name,
                user_id as userId,
                created_at as createdAt,
                is_template as isTemplate,
                source_template_id as sourceTemplateId
           FROM workouts
          ORDER BY is_template DESC, created_at ASC, name ASC`
      );

      return rows.map(toWorkout);
    },

    async listTemplateWorkouts(): Promise<Workout[]> {
      const rows = await database.getAllAsync<WorkoutRow>(
        `SELECT id,
                name,
                user_id as userId,
                created_at as createdAt,
                is_template as isTemplate,
                source_template_id as sourceTemplateId
           FROM workouts
          WHERE is_template = 1
          ORDER BY name ASC`
      );

      return rows.map(toWorkout);
    },

    async getWorkoutById(id: string): Promise<Workout | null> {
      const row = await database.getFirstAsync<WorkoutRow>(
        `SELECT id,
                name,
                user_id as userId,
                created_at as createdAt,
                is_template as isTemplate,
                source_template_id as sourceTemplateId
           FROM workouts
          WHERE id = ?
          LIMIT 1`,
        [id]
      );

      return row ? toWorkout(row) : null;
    },

    async listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
      return database.getAllAsync<WorkoutExercise>(
        `SELECT id,
                workout_id as workoutId,
                exercise_id as exerciseId,
                order_index as orderIndex,
                target_sets as targetSets,
                target_rep_range_low as targetRepRangeLow,
                target_rep_range_high as targetRepRangeHigh,
                target_rest_seconds as targetRestSeconds,
                superset_group_id as supersetGroupId
           FROM workout_exercises
          WHERE workout_id = ?
          ORDER BY order_index ASC`,
        [workoutId]
      );
    },

    async getWorkoutWithExercises(id: string): Promise<WorkoutWithExercises | null> {
      const workout = await this.getWorkoutById(id);

      if (!workout) {
        return null;
      }

      return {
        ...workout,
        exercises: await this.listWorkoutExercises(id)
      };
    },

    async upsertSeedWorkout(workout: SeedWorkout, createdAt = new Date().toISOString()): Promise<void> {
      await database.runAsync(
        `INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id)
         VALUES (?, ?, NULL, ?, 1, NULL)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           user_id = NULL,
           created_at = excluded.created_at,
           is_template = 1,
           source_template_id = NULL`,
        [workout.id, workout.name, createdAt]
      );

      await database.runAsync("DELETE FROM workout_exercises WHERE workout_id = ?", [workout.id]);
      await insertWorkoutExercises(database, workout.id, workout.exercises);
    },

    async createWorkout(input: CreateWorkoutInput): Promise<WorkoutWithExercises> {
      const id = createLocalId("workout");
      const createdAt = new Date().toISOString();

      await database.runAsync(
        `INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [id, input.name, input.userId, createdAt, input.sourceTemplateId ?? null]
      );

      if (input.exercises?.length) {
        await insertWorkoutExercises(database, id, input.exercises);
      }

      const workout = await this.getWorkoutWithExercises(id);

      if (!workout) {
        throw new Error("Workout save completed but the workout could not be read back.");
      }

      return workout;
    },

    async renameWorkout(id: string, name: string): Promise<Workout> {
      const workout = await this.getWorkoutById(id);

      if (!workout) {
        throw new Error(`Workout ${id} was not found.`);
      }

      if (workout.isTemplate) {
        throw new Error("Sample workout templates are protected. Copy the workout before editing.");
      }

      await database.runAsync("UPDATE workouts SET name = ? WHERE id = ?", [name, id]);

      const renamed = await this.getWorkoutById(id);

      if (!renamed) {
        throw new Error(`Workout ${id} was not found after rename.`);
      }

      return renamed;
    },

    async updateWorkout(
      id: string,
      input: { name: string; exercises: WorkoutExerciseSeed[] }
    ): Promise<WorkoutWithExercises> {
      const workout = await this.getWorkoutById(id);

      if (!workout) {
        throw new Error(`Workout ${id} was not found.`);
      }

      if (workout.isTemplate) {
        throw new Error("Sample workout templates are protected. Copy the workout before editing.");
      }

      await runInTransaction(database, async () => {
        await database.runAsync("UPDATE workouts SET name = ? WHERE id = ?", [input.name, id]);
        await database.runAsync("DELETE FROM workout_exercises WHERE workout_id = ?", [id]);
        await insertWorkoutExercises(database, id, input.exercises);
      });

      const updated = await this.getWorkoutWithExercises(id);

      if (!updated) {
        throw new Error(`Workout ${id} was not found after update.`);
      }

      return updated;
    },

    async deleteWorkout(id: string): Promise<void> {
      const workout = await this.getWorkoutById(id);

      if (!workout) {
        throw new Error(`Workout ${id} was not found.`);
      }

      if (workout.isTemplate) {
        throw new Error("Sample workout templates are protected. Copy the workout before editing.");
      }

      await database.runAsync("DELETE FROM workouts WHERE id = ?", [id]);
    },

    async getTopWorkouts(limit = 3): Promise<{ workoutId: string; name: string; runCount: number; lastRun: string | null }[]> {
      return database.getAllAsync<{ workoutId: string; name: string; runCount: number; lastRun: string | null }>(
        `SELECT w.id as workoutId,
                w.name as name,
                COUNT(ws.id) as runCount,
                MAX(ws.ended_at) as lastRun
           FROM workout_sessions ws
           JOIN workouts w ON w.id = ws.workout_id
          WHERE ws.status = 'completed'
          GROUP BY w.id, w.name
          ORDER BY runCount DESC, lastRun DESC
          LIMIT ?`,
        [limit]
      );
    }
    ,
    async copyTemplateWorkout(templateWorkoutId: string, userId: string): Promise<WorkoutWithExercises> {
      const template = await this.getWorkoutWithExercises(templateWorkoutId);

      if (!template) {
        throw new Error(`Template workout ${templateWorkoutId} was not found.`);
      }

      if (!template.isTemplate) {
        throw new Error("Only sample templates can be copied with copyTemplateWorkout.");
      }

      return this.createWorkout({
        name: `${template.name} Copy`,
        userId,
        sourceTemplateId: template.id,
        exercises: template.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          targetSets: exercise.targetSets,
          targetRepRangeLow: exercise.targetRepRangeLow,
          targetRepRangeHigh: exercise.targetRepRangeHigh,
          targetRestSeconds: exercise.targetRestSeconds,
          supersetGroupId: exercise.supersetGroupId
        }))
      });
    }
  };
}
