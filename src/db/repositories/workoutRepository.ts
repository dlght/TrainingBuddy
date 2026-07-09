import type { DatabaseAdapter } from "../client";
import type {
  CreateWorkoutInput,
  SeedWorkout,
  Workout,
  WorkoutExercise,
  WorkoutExerciseSeed,
  WorkoutExerciseSetPlan,
  WorkoutExerciseSetPlanSeed,
  WorkoutWithExercises
} from "../../models/workout";
import { runInTransaction } from "../migrate";
import { createLocalId } from "../../utils/ids";

type WorkoutRow = Omit<Workout, "isTemplate" | "isFavourite"> & {
  isTemplate: number | boolean;
  isFavourite?: number | boolean;
};

function toWorkout(row: WorkoutRow): Workout {
  return {
    ...row,
    isTemplate: Boolean(row.isTemplate),
    isFavourite: row.isFavourite !== undefined ? Boolean(row.isFavourite) : false
  };
}

/**
 * Derives a "uniform" per-set plan (every set carrying the same reps/weight)
 * from an exercise's existing summary fields, for any caller that doesn't pass
 * explicit setPlans. This is what keeps every pre-4 call site (copyTemplateWorkout,
 * seed authoring) working unchanged: a uniform plan is behaviorally identical to
 * today's single-default-per-exercise behavior.
 */
function derivedUniformPlan(exercise: WorkoutExerciseSeed): WorkoutExerciseSetPlanSeed[] {
  return Array.from({ length: exercise.targetSets }, (_, index) => ({
    setNumber: index + 1,
    reps: exercise.targetRepRangeLow,
    weight: exercise.targetWeight
  }));
}

/**
 * Replaces a workout_exercise's planned sets. Safe to delete-and-reinsert
 * outright (unlike workout_exercises itself): nothing else has a foreign key
 * into workout_exercise_set_plans, so there's no history to accidentally break.
 */
async function replaceSetPlans(
  database: DatabaseAdapter,
  workoutExerciseId: string,
  plans: WorkoutExerciseSetPlanSeed[]
): Promise<void> {
  await database.runAsync("DELETE FROM workout_exercise_set_plans WHERE workout_exercise_id = ?", [
    workoutExerciseId
  ]);

  for (const plan of plans) {
    await database.runAsync(
      `INSERT INTO workout_exercise_set_plans (id, workout_exercise_id, set_number, reps, weight)
       VALUES (?, ?, ?, ?, ?)`,
      [createLocalId("set_plan"), workoutExerciseId, plan.setNumber, plan.reps, plan.weight]
    );
  }
}

async function insertWorkoutExercises(
  database: DatabaseAdapter,
  workoutId: string,
  exercises: WorkoutExerciseSeed[]
): Promise<void> {
  for (const exercise of exercises) {
    const id = createLocalId("workout_exercise");

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
          target_weight,
          superset_group_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        workoutId,
        exercise.exerciseId,
        exercise.orderIndex,
        exercise.targetSets,
        exercise.targetRepRangeLow,
        exercise.targetRepRangeHigh,
        exercise.targetRestSeconds,
        exercise.targetWeight,
        exercise.supersetGroupId
      ]
    );

    await replaceSetPlans(database, id, exercise.setPlans ?? derivedUniformPlan(exercise));
  }
}

/**
 * Replaces a workout's exercises without ever deleting a row that a logged set
 * still points to. Re-saving a workout (via the builder, or re-running the
 * sample-workout seed) used to DELETE all of a workout's workout_exercises rows
 * and re-INSERT fresh ones — which throws a FOREIGN KEY constraint failure the
 * moment any set_logs row references one of those rows (set_logs.workout_exercise_id
 * is ON DELETE RESTRICT), i.e. as soon as the workout has ever been used in a
 * session. Upserting by the existing UNIQUE(workout_id, order_index) key instead
 * keeps each row's id stable across saves, so history stays valid. Rows beyond
 * the new exercise count are best-effort deleted (a shrink case); if one is still
 * referenced by history the delete is skipped rather than failing the whole save.
 */
async function upsertWorkoutExercises(
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
          target_weight,
          superset_group_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(workout_id, order_index) DO UPDATE SET
          exercise_id = excluded.exercise_id,
          target_sets = excluded.target_sets,
          target_rep_range_low = excluded.target_rep_range_low,
          target_rep_range_high = excluded.target_rep_range_high,
          target_rest_seconds = excluded.target_rest_seconds,
          target_weight = excluded.target_weight,
          superset_group_id = excluded.superset_group_id`,
      [
        createLocalId("workout_exercise"),
        workoutId,
        exercise.exerciseId,
        exercise.orderIndex,
        exercise.targetSets,
        exercise.targetRepRangeLow,
        exercise.targetRepRangeHigh,
        exercise.targetRestSeconds,
        exercise.targetWeight,
        exercise.supersetGroupId
      ]
    );

    const row = await database.getFirstAsync<{ id: string }>(
      "SELECT id FROM workout_exercises WHERE workout_id = ? AND order_index = ?",
      [workoutId, exercise.orderIndex]
    );

    if (row) {
      await replaceSetPlans(database, row.id, exercise.setPlans ?? derivedUniformPlan(exercise));
    }
  }

  const keptOrderIndexes = exercises.map((exercise) => exercise.orderIndex);
  const staleRows = await database.getAllAsync<{ id: string; orderIndex: number }>(
    `SELECT id, order_index as orderIndex FROM workout_exercises WHERE workout_id = ?`,
    [workoutId]
  );

  for (const row of staleRows) {
    if (keptOrderIndexes.includes(row.orderIndex)) {
      continue;
    }

    try {
      await database.runAsync("DELETE FROM workout_exercises WHERE id = ?", [row.id]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!/foreign key constraint failed/i.test(message)) {
        throw error;
      }
      // Still referenced by logged history — leave it in place rather than fail the save.
    }
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
                source_template_id as sourceTemplateId,
                is_favourite as isFavourite
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
                source_template_id as sourceTemplateId,
                is_favourite as isFavourite
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
                source_template_id as sourceTemplateId,
                is_favourite as isFavourite
           FROM workouts
          WHERE id = ?
          LIMIT 1`,
        [id]
      );

      return row ? toWorkout(row) : null;
    },

    async listSetPlans(workoutExerciseId: string): Promise<WorkoutExerciseSetPlan[]> {
      return database.getAllAsync<WorkoutExerciseSetPlan>(
        `SELECT id,
                workout_exercise_id as workoutExerciseId,
                set_number as setNumber,
                reps,
                weight
           FROM workout_exercise_set_plans
          WHERE workout_exercise_id = ?
          ORDER BY set_number ASC`,
        [workoutExerciseId]
      );
    },

    async listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
      const rows = await database.getAllAsync<Omit<WorkoutExercise, "setPlans">>(
        `SELECT id,
                workout_id as workoutId,
                exercise_id as exerciseId,
                order_index as orderIndex,
                target_sets as targetSets,
                target_rep_range_low as targetRepRangeLow,
                target_rep_range_high as targetRepRangeHigh,
                target_rest_seconds as targetRestSeconds,
                target_weight as targetWeight,
                superset_group_id as supersetGroupId
           FROM workout_exercises
          WHERE workout_id = ?
          ORDER BY order_index ASC`,
        [workoutId]
      );

      if (rows.length === 0) {
        return [];
      }

      const allPlans = await database.getAllAsync<WorkoutExerciseSetPlan>(
        `SELECT id,
                workout_exercise_id as workoutExerciseId,
                set_number as setNumber,
                reps,
                weight
           FROM workout_exercise_set_plans
          WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)
          ORDER BY set_number ASC`,
        [workoutId]
      );
      const plansByExerciseId = new Map<string, WorkoutExerciseSetPlan[]>();

      for (const plan of allPlans) {
        const existing = plansByExerciseId.get(plan.workoutExerciseId) ?? [];
        existing.push(plan);
        plansByExerciseId.set(plan.workoutExerciseId, existing);
      }

      return rows.map((row) => ({
        ...row,
        setPlans: plansByExerciseId.get(row.id) ?? []
      }));
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
        `INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id, is_favourite)
         VALUES (?, ?, NULL, ?, 1, NULL, 0)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           user_id = NULL,
           created_at = excluded.created_at,
           is_template = 1,
           source_template_id = NULL`,
        [workout.id, workout.name, createdAt]
      );

      await upsertWorkoutExercises(database, workout.id, workout.exercises);
    },

    async toggleFavourite(workoutId: string): Promise<Workout> {
      const workout = await this.getWorkoutById(workoutId);

      if (!workout) {
        throw new Error(`Workout ${workoutId} was not found.`);
      }

      const newFavouriteState = !workout.isFavourite;
      await database.runAsync("UPDATE workouts SET is_favourite = ? WHERE id = ?", [newFavouriteState ? 1 : 0, workoutId]);

      const updated = await this.getWorkoutById(workoutId);

      if (!updated) {
        throw new Error(`Workout ${workoutId} was not found after favourite toggle.`);
      }

      return updated;
    },

    async listFavouriteWorkouts(): Promise<Workout[]> {
      const rows = await database.getAllAsync<WorkoutRow>(
        `SELECT id,
                name,
                user_id as userId,
                created_at as createdAt,
                is_template as isTemplate,
                source_template_id as sourceTemplateId,
                is_favourite as isFavourite
           FROM workouts
          WHERE is_favourite = 1
          ORDER BY created_at DESC`
      );

      return rows.map(toWorkout);
    },

    async getSeededWorkouts(): Promise<Workout[]> {
      const rows = await database.getAllAsync<WorkoutRow>(
        `SELECT id,
                name,
                user_id as userId,
                created_at as createdAt,
                is_template as isTemplate,
                source_template_id as sourceTemplateId,
                is_favourite as isFavourite
           FROM workouts
          WHERE is_template = 1
          ORDER BY name ASC`
      );

      return rows.map(toWorkout);
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
        await upsertWorkoutExercises(database, id, input.exercises);
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
          targetWeight: exercise.targetWeight,
          supersetGroupId: exercise.supersetGroupId,
          setPlans: exercise.setPlans.map((plan) => ({
            setNumber: plan.setNumber,
            reps: plan.reps,
            weight: plan.weight
          }))
        }))
      });
    }
  };
}
