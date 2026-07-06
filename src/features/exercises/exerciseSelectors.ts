import type { Exercise, MuscleGroup, MuscleGroupName } from "@/models/exercise";

export const muscleGroupOrder: MuscleGroupName[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core"
];

export type GroupedExercises = {
  muscleGroup: MuscleGroup;
  exercises: Exercise[];
};

export function formatMuscleGroupName(name: MuscleGroupName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function sortMuscleGroups(groups: MuscleGroup[]): MuscleGroup[] {
  return [...groups].sort((a, b) => {
    const aIndex = muscleGroupOrder.indexOf(a.id);
    const bIndex = muscleGroupOrder.indexOf(b.id);

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.name.localeCompare(b.name);
  });
}

export function sortExercisesByName(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => a.name.localeCompare(b.name));
}

export function groupExercisesByMuscleGroup(
  exercises: Exercise[],
  muscleGroups: MuscleGroup[]
): GroupedExercises[] {
  const sortedGroups = sortMuscleGroups(muscleGroups);

  return sortedGroups.map((muscleGroup) => ({
    muscleGroup,
    exercises: sortExercisesByName(
      exercises.filter((exercise) => exercise.muscleGroupId === muscleGroup.id)
    )
  }));
}

export function getExercisesForMuscleGroup(
  exercises: Exercise[],
  muscleGroupId: MuscleGroupName
): Exercise[] {
  return sortExercisesByName(
    exercises.filter((exercise) => exercise.muscleGroupId === muscleGroupId)
  );
}

export function getFirstAvailableMuscleGroup(
  groups: GroupedExercises[]
): MuscleGroupName | null {
  return groups.find((group) => group.exercises.length > 0)?.muscleGroup.id ?? null;
}
