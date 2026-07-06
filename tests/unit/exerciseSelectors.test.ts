import {
  getExercisesForMuscleGroup,
  getFirstAvailableMuscleGroup,
  groupExercisesByMuscleGroup
} from "@/features/exercises/exerciseSelectors";
import type { Exercise, MuscleGroup } from "@/models/exercise";

const muscleGroups: MuscleGroup[] = [
  { id: "legs", name: "legs" },
  { id: "chest", name: "chest" },
  { id: "back", name: "back" }
];

const exercises: Exercise[] = [
  {
    id: "row",
    name: "Row",
    muscleGroupId: "back",
    equipment: "dumbbell",
    imageUrl: "assets/seed-exercises/row.webp",
    instructions: "Pull with control.",
    isWarmup: false,
    videoUrl: null,
    source: "test",
    sourceId: "row",
    licenseAuthor: null,
    licenseUrl: null
  },
  {
    id: "squat",
    name: "Squat",
    muscleGroupId: "legs",
    equipment: "bodyweight",
    imageUrl: "assets/seed-exercises/squat.webp",
    instructions: "Sit back and stand tall.",
    isWarmup: true,
    videoUrl: null,
    source: "test",
    sourceId: "squat",
    licenseAuthor: null,
    licenseUrl: null
  },
  {
    id: "push-up",
    name: "Push-Up",
    muscleGroupId: "chest",
    equipment: "bodyweight",
    imageUrl: "assets/seed-exercises/push-up.webp",
    instructions: "Lower and press.",
    isWarmup: false,
    videoUrl: null,
    source: "test",
    sourceId: "push-up",
    licenseAuthor: null,
    licenseUrl: null
  }
];

describe("exerciseSelectors", () => {
  it("groups exercises by app muscle group order", () => {
    const grouped = groupExercisesByMuscleGroup(exercises, muscleGroups);

    expect(grouped.map((group) => group.muscleGroup.id)).toEqual(["chest", "back", "legs"]);
    expect(grouped[0].exercises.map((exercise) => exercise.id)).toEqual(["push-up"]);
  });

  it("returns sorted exercises for a single muscle group", () => {
    expect(getExercisesForMuscleGroup(exercises, "legs")).toEqual([exercises[1]]);
  });

  it("finds the first muscle group with exercises", () => {
    expect(getFirstAvailableMuscleGroup(groupExercisesByMuscleGroup(exercises, muscleGroups))).toBe("chest");
  });
});
