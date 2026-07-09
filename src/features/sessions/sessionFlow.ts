export type SessionFlowExercise = {
  id: string;
  targetSets: number;
  loggedSetCount: number;
};

export type SessionFlowStep =
  | { type: "same-exercise" }
  | { type: "next-exercise"; index: number }
  | { type: "workout-complete" };

export function resolveNextSessionStep(
  exercises: SessionFlowExercise[],
  currentExerciseIndex: number
): SessionFlowStep {
  const currentExercise = exercises[currentExerciseIndex];

  if (!currentExercise || currentExercise.loggedSetCount < currentExercise.targetSets) {
    return { type: "same-exercise" };
  }

  const nextIndex = currentExerciseIndex + 1;

  if (nextIndex >= exercises.length) {
    return { type: "workout-complete" };
  }

  return { type: "next-exercise", index: nextIndex };
}

export function isSessionFullyLogged(exercises: SessionFlowExercise[]): boolean {
  return exercises.length > 0 && exercises.every((exercise) => exercise.loggedSetCount >= exercise.targetSets);
}

export type SessionFlowSetPlan = {
  setNumber: number;
  reps: number;
  weight: number | null;
};

/**
 * Returns the planned reps/weight for the next set of an exercise (the set
 * immediately after loggedSetCount), or null if there's no plan for it (an
 * older workout with no per-set plan, or every planned set already logged).
 * Set numbers are 1-indexed; loggedSetCount is a count, so set N is looked up
 * by loggedSetCount + 1.
 */
export function getPlannedSetValues(
  setPlans: SessionFlowSetPlan[] | undefined,
  loggedSetCount: number
): { reps: number; weight: number | null } | null {
  const plan = setPlans?.find((entry) => entry.setNumber === loggedSetCount + 1);

  return plan ? { reps: plan.reps, weight: plan.weight } : null;
}
