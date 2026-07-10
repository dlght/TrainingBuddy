import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUserId } from "@/lib/currentUser";
import type {
  CreateWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutExerciseSeed,
  WorkoutExerciseSetPlanSeed,
  WorkoutWithExercises
} from "@/models/workout";
import { createLocalId } from "@/utils/ids";

type WorkoutRow = {
  id: string;
  name: string;
  user_id: string | null;
  created_at: string;
  is_template: boolean;
  source_template_id: string | null;
  is_favourite: boolean;
};

type SetPlanRow = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number | null;
};

type WorkoutExerciseRow = {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_rep_range_low: number;
  target_rep_range_high: number;
  target_rest_seconds: number;
  target_weight: number | null;
  superset_group_id: string | null;
  workout_exercise_set_plans?: SetPlanRow[];
};

/**
 * Sample (template) workouts are shared rows with no owning user, so
 * `is_favourite` on the row itself can't represent "favourited by account
 * X" without leaking to every other account (see
 * sample_workout_favourites). Non-template rows keep reading the column
 * directly, unchanged.
 */
function toWorkout(row: WorkoutRow, favouritedTemplateIds?: Set<string>): Workout {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    createdAt: row.created_at,
    isTemplate: row.is_template,
    sourceTemplateId: row.source_template_id,
    isFavourite: row.is_template ? (favouritedTemplateIds?.has(row.id) ?? false) : row.is_favourite
  };
}

function toSetPlan(row: SetPlanRow) {
  return {
    id: row.id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: row.set_number,
    reps: row.reps,
    weight: row.weight
  };
}

function toWorkoutExercise(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    orderIndex: row.order_index,
    targetSets: row.target_sets,
    targetRepRangeLow: row.target_rep_range_low,
    targetRepRangeHigh: row.target_rep_range_high,
    targetRestSeconds: row.target_rest_seconds,
    targetWeight: row.target_weight,
    supersetGroupId: row.superset_group_id,
    setPlans: (row.workout_exercise_set_plans ?? [])
      .slice()
      .sort((a, b) => a.set_number - b.set_number)
      .map(toSetPlan)
  };
}

/**
 * Derives a uniform per-set plan (every set carrying the same reps/weight)
 * from an exercise's summary fields, for any caller that doesn't pass
 * explicit setPlans — keeps seed authoring and template copies simple.
 */
function derivedUniformPlan(exercise: WorkoutExerciseSeed): WorkoutExerciseSetPlanSeed[] {
  return Array.from({ length: exercise.targetSets }, (_, index) => ({
    setNumber: index + 1,
    reps: exercise.targetRepRangeLow,
    weight: exercise.targetWeight
  }));
}

const FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === FOREIGN_KEY_VIOLATION;
}

export function createWorkoutRepository(client: SupabaseClient) {
  async function getFavouritedTemplateIds(): Promise<Set<string>> {
    const userId = await requireUserId(client);
    const { data, error } = await client
      .from("sample_workout_favourites")
      .select("workout_id")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return new Set(((data ?? []) as { workout_id: string }[]).map((row) => row.workout_id));
  }

  async function listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
    const { data, error } = await client
      .from("workout_exercises")
      .select("*, workout_exercise_set_plans(*)")
      .eq("workout_id", workoutId)
      .order("order_index");

    if (error) {
      throw error;
    }

    return ((data ?? []) as WorkoutExerciseRow[]).map(toWorkoutExercise);
  }

  async function getWorkoutById(id: string): Promise<Workout | null> {
    const { data, error } = await client.from("workouts").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as WorkoutRow;

    if (!row.is_template) {
      return toWorkout(row);
    }

    return toWorkout(row, await getFavouritedTemplateIds());
  }

  async function getWorkoutWithExercises(id: string): Promise<WorkoutWithExercises | null> {
    const workout = await getWorkoutById(id);

    if (!workout) {
      return null;
    }

    return { ...workout, exercises: await listWorkoutExercises(id) };
  }

  async function replaceSetPlans(workoutExerciseId: string, plans: WorkoutExerciseSetPlanSeed[]): Promise<void> {
    const { error: deleteError } = await client
      .from("workout_exercise_set_plans")
      .delete()
      .eq("workout_exercise_id", workoutExerciseId);

    if (deleteError) {
      throw deleteError;
    }

    if (plans.length === 0) {
      return;
    }

    const { error: insertError } = await client.from("workout_exercise_set_plans").insert(
      plans.map((plan) => ({
        id: createLocalId("set_plan"),
        workout_exercise_id: workoutExerciseId,
        set_number: plan.setNumber,
        reps: plan.reps,
        weight: plan.weight
      }))
    );

    if (insertError) {
      throw insertError;
    }
  }

  async function insertWorkoutExercises(workoutId: string, exercises: WorkoutExerciseSeed[]): Promise<void> {
    for (const exercise of exercises) {
      const id = createLocalId("workout_exercise");

      const { error } = await client.from("workout_exercises").insert({
        id,
        workout_id: workoutId,
        exercise_id: exercise.exerciseId,
        order_index: exercise.orderIndex,
        target_sets: exercise.targetSets,
        target_rep_range_low: exercise.targetRepRangeLow,
        target_rep_range_high: exercise.targetRepRangeHigh,
        target_rest_seconds: exercise.targetRestSeconds,
        target_weight: exercise.targetWeight,
        superset_group_id: exercise.supersetGroupId
      });

      if (error) {
        throw error;
      }

      await replaceSetPlans(id, exercise.setPlans ?? derivedUniformPlan(exercise));
    }
  }

  /**
   * Replaces a workout's exercises without ever deleting a row that a logged
   * set still points to (set_logs.workout_exercise_id is ON DELETE
   * RESTRICT). Each exercise keeps its existing row (and stable id) if one
   * already exists at that order_index, matched by fetching first rather
   * than blindly upserting, so the id is never rewritten out from under
   * existing history. Rows beyond the new exercise count are best-effort
   * deleted; a still-referenced row silently survives instead of failing
   * the whole save.
   */
  async function upsertWorkoutExercises(workoutId: string, exercises: WorkoutExerciseSeed[]): Promise<void> {
    const { data: existingRows, error: existingError } = await client
      .from("workout_exercises")
      .select("id, order_index")
      .eq("workout_id", workoutId);

    if (existingError) {
      throw existingError;
    }

    const existingByOrderIndex = new Map<number, string>(
      ((existingRows ?? []) as { id: string; order_index: number }[]).map((row) => [row.order_index, row.id])
    );

    for (const exercise of exercises) {
      const existingId = existingByOrderIndex.get(exercise.orderIndex);
      const id = existingId ?? createLocalId("workout_exercise");

      const { error } = await client.from("workout_exercises").upsert({
        id,
        workout_id: workoutId,
        exercise_id: exercise.exerciseId,
        order_index: exercise.orderIndex,
        target_sets: exercise.targetSets,
        target_rep_range_low: exercise.targetRepRangeLow,
        target_rep_range_high: exercise.targetRepRangeHigh,
        target_rest_seconds: exercise.targetRestSeconds,
        target_weight: exercise.targetWeight,
        superset_group_id: exercise.supersetGroupId
      });

      if (error) {
        throw error;
      }

      await replaceSetPlans(id, exercise.setPlans ?? derivedUniformPlan(exercise));
    }

    const keptOrderIndexes = new Set(exercises.map((exercise) => exercise.orderIndex));
    const staleIds = Array.from(existingByOrderIndex.entries())
      .filter(([orderIndex]) => !keptOrderIndexes.has(orderIndex))
      .map(([, id]) => id);

    for (const staleId of staleIds) {
      const { error } = await client.from("workout_exercises").delete().eq("id", staleId);

      if (error && !isForeignKeyViolation(error)) {
        throw error;
      }
      // Still referenced by logged history — leave it in place rather than fail the save.
    }
  }

  return {
    getWorkoutById,
    getWorkoutWithExercises,
    listWorkoutExercises,

    async listWorkouts(): Promise<Workout[]> {
      // RLS already limits rows to the caller's own workouts plus templates.
      const { data, error } = await client
        .from("workouts")
        .select("*")
        .order("is_template", { ascending: false })
        .order("created_at")
        .order("name");

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as WorkoutRow[];
      const favouritedTemplateIds = rows.some((row) => row.is_template)
        ? await getFavouritedTemplateIds()
        : undefined;

      return rows.map((row) => toWorkout(row, favouritedTemplateIds));
    },

    async listFavouriteWorkouts(): Promise<Workout[]> {
      const userId = await requireUserId(client);

      const { data: customRows, error: customError } = await client
        .from("workouts")
        .select("*")
        .eq("is_favourite", true)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (customError) {
        throw customError;
      }

      const { data: templateFavourites, error: favError } = await client
        .from("sample_workout_favourites")
        .select("workout_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (favError) {
        throw favError;
      }

      const favouritedTemplateIds = new Set(
        ((templateFavourites ?? []) as { workout_id: string }[]).map((row) => row.workout_id)
      );

      let templateRows: WorkoutRow[] = [];

      if (favouritedTemplateIds.size > 0) {
        const { data, error } = await client
          .from("workouts")
          .select("*")
          .in("id", Array.from(favouritedTemplateIds));

        if (error) {
          throw error;
        }

        templateRows = (data ?? []) as WorkoutRow[];
      }

      // Templates keep the favourited-at order from sample_workout_favourites
      // above (most recently favourited first), not the row-fetch order.
      const orderedTemplateRows = Array.from(favouritedTemplateIds)
        .map((id) => templateRows.find((row) => row.id === id))
        .filter((row): row is WorkoutRow => row !== undefined);

      return [
        ...((customRows ?? []) as WorkoutRow[]).map((row) => toWorkout(row)),
        ...orderedTemplateRows.map((row) => toWorkout(row, favouritedTemplateIds))
      ];
    },

    async getSeededWorkouts(): Promise<Workout[]> {
      const { data, error } = await client.from("workouts").select("*").eq("is_template", true).order("name");

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as WorkoutRow[];
      const favouritedTemplateIds = await getFavouritedTemplateIds();

      return rows.map((row) => toWorkout(row, favouritedTemplateIds));
    },

    async getTopWorkouts(
      limit = 3
    ): Promise<{ workoutId: string; name: string; runCount: number; lastRun: string | null }[]> {
      const { data, error } = await client
        .from("workout_sessions")
        .select("workout_id, ended_at")
        .eq("status", "completed");

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as { workout_id: string; ended_at: string | null }[];
      const byWorkout = new Map<string, { workoutId: string; runCount: number; lastRun: string | null }>();

      for (const row of rows) {
        const existing = byWorkout.get(row.workout_id);
        const lastRun =
          existing?.lastRun && row.ended_at
            ? existing.lastRun > row.ended_at
              ? existing.lastRun
              : row.ended_at
            : (existing?.lastRun ?? row.ended_at);

        byWorkout.set(row.workout_id, {
          workoutId: row.workout_id,
          runCount: (existing?.runCount ?? 0) + 1,
          lastRun
        });
      }

      const ranked = Array.from(byWorkout.values())
        .sort((a, b) => b.runCount - a.runCount || (b.lastRun ?? "").localeCompare(a.lastRun ?? ""))
        .slice(0, limit);

      if (ranked.length === 0) {
        return [];
      }

      const { data: workoutRows, error: workoutError } = await client
        .from("workouts")
        .select("id, name")
        .in(
          "id",
          ranked.map((row) => row.workoutId)
        );

      if (workoutError) {
        throw workoutError;
      }

      const nameById = new Map(((workoutRows ?? []) as { id: string; name: string }[]).map((row) => [row.id, row.name]));

      return ranked.map((row) => ({ ...row, name: nameById.get(row.workoutId) ?? row.workoutId }));
    },

    async createWorkout(input: CreateWorkoutInput): Promise<WorkoutWithExercises> {
      const id = createLocalId("workout");

      const { error } = await client.from("workouts").insert({
        id,
        name: input.name,
        user_id: input.userId,
        is_template: false,
        source_template_id: input.sourceTemplateId ?? null
      });

      if (error) {
        throw error;
      }

      if (input.exercises?.length) {
        await insertWorkoutExercises(id, input.exercises);
      }

      const workout = await getWorkoutWithExercises(id);

      if (!workout) {
        throw new Error("Workout save completed but the workout could not be read back.");
      }

      return workout;
    },

    async updateWorkout(
      id: string,
      input: { name: string; exercises: WorkoutExerciseSeed[] }
    ): Promise<WorkoutWithExercises> {
      const workout = await getWorkoutById(id);

      if (!workout) {
        throw new Error(`Workout ${id} was not found.`);
      }

      if (workout.isTemplate) {
        throw new Error("Sample workout templates are protected. Copy the workout before editing.");
      }

      const { error } = await client.from("workouts").update({ name: input.name }).eq("id", id);

      if (error) {
        throw error;
      }

      await upsertWorkoutExercises(id, input.exercises);

      const updated = await getWorkoutWithExercises(id);

      if (!updated) {
        throw new Error(`Workout ${id} was not found after update.`);
      }

      return updated;
    },

    async deleteWorkout(id: string): Promise<void> {
      const workout = await getWorkoutById(id);

      if (!workout) {
        throw new Error(`Workout ${id} was not found.`);
      }

      if (workout.isTemplate) {
        throw new Error("Sample workout templates are protected. Copy the workout before editing.");
      }

      const { error } = await client.from("workouts").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },

    async toggleFavourite(workoutId: string): Promise<Workout> {
      const workout = await getWorkoutById(workoutId);

      if (!workout) {
        throw new Error(`Workout ${workoutId} was not found.`);
      }

      if (workout.isTemplate) {
        const userId = await requireUserId(client);

        if (workout.isFavourite) {
          const { error } = await client
            .from("sample_workout_favourites")
            .delete()
            .eq("user_id", userId)
            .eq("workout_id", workoutId);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await client
            .from("sample_workout_favourites")
            .insert({ user_id: userId, workout_id: workoutId });

          if (error) {
            throw error;
          }
        }
      } else {
        const { error } = await client
          .from("workouts")
          .update({ is_favourite: !workout.isFavourite })
          .eq("id", workoutId);

        if (error) {
          throw error;
        }
      }

      const updated = await getWorkoutById(workoutId);

      if (!updated) {
        throw new Error(`Workout ${workoutId} was not found after favourite toggle.`);
      }

      return updated;
    },

    async copyTemplateWorkout(templateWorkoutId: string, userId: string): Promise<WorkoutWithExercises> {
      const template = await getWorkoutWithExercises(templateWorkoutId);

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
