import type { WorkoutExerciseSeed } from "@/models/workout";

export type WorkoutExerciseTargetValues = {
  exerciseId: string;
  targetSets: string | number;
  targetRepRangeLow: string | number;
  targetRepRangeHigh: string | number;
  targetRestSeconds: string | number;
  supersetGroupId?: string | null;
};

export type WorkoutDraftValues = {
  name: string;
  exercises: WorkoutExerciseTargetValues[];
};

export type WorkoutExerciseTargetErrors = Partial<
  Record<"exerciseId" | "targetSets" | "targetRepRangeLow" | "targetRepRangeHigh" | "targetRestSeconds", string>
>;

export type WorkoutValidationErrors = {
  name?: string;
  exercises?: string;
  exerciseTargets?: Record<number, WorkoutExerciseTargetErrors>;
  supersets?: string;
};

export type WorkoutValidationResult = {
  isValid: boolean;
  errors: WorkoutValidationErrors;
  value?: {
    name: string;
    exercises: WorkoutExerciseSeed[];
  };
};

type SupersetAssignable = {
  exerciseId: string;
  supersetGroupId?: string | null;
};

function integerFrom(value: string | number): number | null {
  const parsed = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function normalizeSupersetGroupId(groupId: string | null | undefined): string | null {
  const normalized = groupId?.trim() ?? "";

  return normalized.length > 0 ? normalized : null;
}

export function validateWorkoutName(name: string): string | null {
  return name.trim().length > 0 ? null : "Name this workout.";
}

export function validateWorkoutExerciseTarget(
  target: WorkoutExerciseTargetValues
): {
  errors: WorkoutExerciseTargetErrors;
  value?: Omit<WorkoutExerciseSeed, "orderIndex">;
} {
  const errors: WorkoutExerciseTargetErrors = {};
  const exerciseId = target.exerciseId.trim();
  const targetSets = integerFrom(target.targetSets);
  const targetRepRangeLow = integerFrom(target.targetRepRangeLow);
  const targetRepRangeHigh = integerFrom(target.targetRepRangeHigh);
  const targetRestSeconds = integerFrom(target.targetRestSeconds);

  if (!exerciseId) {
    errors.exerciseId = "Choose an exercise.";
  }

  if (targetSets === null || targetSets <= 0) {
    errors.targetSets = "Sets must be a whole number above 0.";
  }

  if (targetRepRangeLow === null || targetRepRangeLow <= 0) {
    errors.targetRepRangeLow = "Rep range must start above 0.";
  }

  if (targetRepRangeHigh === null || targetRepRangeHigh <= 0) {
    errors.targetRepRangeHigh = "Rep range must end above 0.";
  } else if (targetRepRangeLow !== null && targetRepRangeHigh < targetRepRangeLow) {
    errors.targetRepRangeHigh = "Rep range end must be at least the start.";
  }

  if (targetRestSeconds === null || targetRestSeconds < 0) {
    errors.targetRestSeconds = "Rest must be 0 seconds or more.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    value: {
      exerciseId,
      targetSets: targetSets as number,
      targetRepRangeLow: targetRepRangeLow as number,
      targetRepRangeHigh: targetRepRangeHigh as number,
      targetRestSeconds: targetRestSeconds as number,
      supersetGroupId: normalizeSupersetGroupId(target.supersetGroupId)
    }
  };
}

export function validateWorkoutDraft(values: WorkoutDraftValues): WorkoutValidationResult {
  const errors: WorkoutValidationErrors = {};
  const nameError = validateWorkoutName(values.name);

  if (nameError) {
    errors.name = nameError;
  }

  if (values.exercises.length === 0) {
    errors.exercises = "Add at least one exercise before saving.";
  }

  const exercises: WorkoutExerciseSeed[] = [];

  values.exercises.forEach((exercise, index) => {
    const result = validateWorkoutExerciseTarget(exercise);

    if (Object.keys(result.errors).length > 0) {
      errors.exerciseTargets = {
        ...errors.exerciseTargets,
        [index]: result.errors
      };
      return;
    }

    if (result.value) {
      exercises.push({
        ...result.value,
        orderIndex: index
      });
    }
  });

  const supersetCounts = exercises.reduce<Record<string, number>>((counts, exercise) => {
    if (!exercise.supersetGroupId) {
      return counts;
    }

    return {
      ...counts,
      [exercise.supersetGroupId]: (counts[exercise.supersetGroupId] ?? 0) + 1
    };
  }, {});

  const hasSingleExerciseSuperset = Object.values(supersetCounts).some((count) => count === 1);

  if (hasSingleExerciseSuperset) {
    errors.supersets = "Supersets need at least two exercises in the same group.";
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    value: isValid
      ? {
          name: values.name.trim(),
          exercises
        }
      : undefined
  };
}

export function formatWorkoutValidationErrors(errors: WorkoutValidationErrors): string {
  const targetErrors = Object.values(errors.exerciseTargets ?? {}).flatMap((fieldErrors) =>
    Object.values(fieldErrors)
  );
  const messages = [
    errors.name,
    errors.exercises,
    errors.supersets,
    ...targetErrors
  ].filter(Boolean);

  return messages[0] ?? "Workout details are not ready to save.";
}

export function assignSupersetGroup<TExercise extends SupersetAssignable>(
  exercises: TExercise[],
  exerciseIds: string[],
  groupId = "superset-a"
): TExercise[] {
  const selectedIds = new Set(exerciseIds);
  const normalizedGroupId = normalizeSupersetGroupId(groupId);

  if (selectedIds.size < 2 || !normalizedGroupId) {
    throw new Error("Choose at least two exercises for a superset.");
  }

  return exercises.map((exercise) =>
    selectedIds.has(exercise.exerciseId)
      ? {
          ...exercise,
          supersetGroupId: normalizedGroupId
        }
      : exercise
  );
}

export function clearSupersetGroup<TExercise extends SupersetAssignable>(
  exercises: TExercise[],
  exerciseId: string
): TExercise[] {
  return exercises.map((exercise) =>
    exercise.exerciseId === exerciseId
      ? {
          ...exercise,
          supersetGroupId: null
        }
      : exercise
  );
}
