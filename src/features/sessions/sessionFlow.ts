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
