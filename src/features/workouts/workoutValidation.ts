import type { WorkoutExerciseSeed, WorkoutExerciseSetPlanSeed } from "@/models/workout";

export type WorkoutExerciseSetPlanInput = {
  reps: string | number;
  weight?: string | number | null;
};

export type WorkoutExerciseTargetValues = {
  exerciseId: string;
  targetRestSeconds: string | number;
  setPlans: WorkoutExerciseSetPlanInput[];
};

export type WorkoutDraftValues = {
  name: string;
  exercises: WorkoutExerciseTargetValues[];
};

export type WorkoutExerciseTargetErrors = Partial<
  Record<"exerciseId" | "targetRestSeconds" | "setPlans", string>
>;

export type WorkoutValidationErrors = {
  name?: string;
  exercises?: string;
  exerciseTargets?: Record<number, WorkoutExerciseTargetErrors>;
};

export type WorkoutValidationResult = {
  isValid: boolean;
  errors: WorkoutValidationErrors;
  value?: {
    name: string;
    exercises: WorkoutExerciseSeed[];
  };
};

function integerFrom(value: string | number): number | null {
  const parsed = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function nonNegativeNumberOrNull(
  value: string | number | null | undefined
): { isValid: true; value: number | null } | { isValid: false } {
  if (value === null || value === undefined) {
    return { isValid: true, value: null };
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return { isValid: true, value: null };
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { isValid: false };
  }

  return { isValid: true, value: parsed };
}

export function validateWorkoutName(name: string): string | null {
  return name.trim().length > 0 ? null : "Name this workout.";
}

/**
 * Validates a single set of a per-set plan: reps must be a positive whole
 * number, weight (when provided) must be 0 or more. Returns null on failure
 * so the caller can flag the whole plan without needing per-row error UI.
 */
function parseSetPlan(set: WorkoutExerciseSetPlanInput, setNumber: number): WorkoutExerciseSetPlanSeed | null {
  const reps = integerFrom(set.reps);
  const weightResult = nonNegativeNumberOrNull(set.weight ?? null);

  if (reps === null || reps <= 0 || !weightResult.isValid) {
    return null;
  }

  return { setNumber, reps, weight: weightResult.value };
}

export function validateWorkoutExerciseTarget(
  target: WorkoutExerciseTargetValues
): {
  errors: WorkoutExerciseTargetErrors;
  value?: Omit<WorkoutExerciseSeed, "orderIndex">;
} {
  const errors: WorkoutExerciseTargetErrors = {};
  const exerciseId = target.exerciseId.trim();
  const targetRestSeconds = integerFrom(target.targetRestSeconds);

  if (!exerciseId) {
    errors.exerciseId = "Choose an exercise.";
  }

  if (targetRestSeconds === null || targetRestSeconds < 0) {
    errors.targetRestSeconds = "Rest must be 0 seconds or more.";
  }

  let setPlans: WorkoutExerciseSetPlanSeed[] = [];

  if (!target.setPlans || target.setPlans.length === 0) {
    errors.setPlans = "Add at least one set.";
  } else {
    const parsed = target.setPlans.map((set, index) => parseSetPlan(set, index + 1));

    if (parsed.some((set) => set === null)) {
      errors.setPlans = "Each set needs reps above 0 and a weight of 0 or more.";
    } else {
      setPlans = parsed as WorkoutExerciseSetPlanSeed[];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const reps = setPlans.map((set) => set.reps);
  const weights = setPlans.map((set) => set.weight).filter((weight): weight is number => weight !== null);

  return {
    errors,
    value: {
      exerciseId,
      targetSets: setPlans.length,
      targetRepRangeLow: Math.min(...reps),
      targetRepRangeHigh: Math.max(...reps),
      targetRestSeconds: targetRestSeconds as number,
      targetWeight: weights.length > 0 ? weights[0] : null,
      supersetGroupId: null,
      setPlans
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
    ...targetErrors
  ].filter(Boolean);

  return messages[0] ?? "Workout details are not ready to save.";
}
