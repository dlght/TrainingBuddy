import type { Exercise } from "@/models/exercise";

// Program Type to muscle group mappings
const PROGRAM_TYPE_MUSCLE_GROUPS: Record<string, string[]> = {
  Push: ["chest", "shoulders", "arms"],
  Pull: ["back", "arms", "shoulders"],
  Legs: ["legs"],
  "Upper Body": ["chest", "back", "shoulders", "arms"],
  "Lower Body": ["legs", "core"],
  "Full Body": ["chest", "back", "legs", "shoulders", "arms", "core"]
};

export function filterExercisesByProgramType(
  exercises: Exercise[],
  programType: string | null
): Exercise[] {
  if (!programType || programType === "All") {
    return exercises;
  }

  const targetMuscleGroups = PROGRAM_TYPE_MUSCLE_GROUPS[programType];
  if (!targetMuscleGroups) {
    return exercises;
  }

  return exercises.filter((exercise) =>
    targetMuscleGroups.includes(exercise.muscleGroupId)
  );
}

export function getAlternativeExercises(
  exercises: Exercise[],
  currentExercise: Exercise,
  limit: number = 3
): Exercise[] {
  return exercises
    .filter(
      (exercise) =>
        exercise.muscleGroupId === currentExercise.muscleGroupId &&
        exercise.id !== currentExercise.id
    )
    .slice(0, limit);
}

export function getCurrentExercise(
  exercises: Exercise[],
  currentIndex: number
): Exercise | null {
  if (currentIndex < 0 || currentIndex >= exercises.length) {
    return null;
  }
  return exercises[currentIndex];
}

export function hasMoreExercises(
  exercises: Exercise[],
  currentIndex: number
): boolean {
  return currentIndex < exercises.length - 1;
}

export function isLastExercise(
  exercises: Exercise[],
  currentIndex: number
): boolean {
  return currentIndex === exercises.length - 1;
}
