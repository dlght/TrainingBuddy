export type MuscleGroupName = "chest" | "back" | "legs" | "shoulders" | "arms" | "core";

export type MuscleGroup = {
  id: MuscleGroupName;
  name: MuscleGroupName;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroupId: MuscleGroupName;
  equipment: string | null;
  imageUrl: string;
  instructions: string;
  isWarmup: boolean;
  videoUrl: string | null;
  source: string | null;
  sourceId: string | null;
  licenseAuthor: string | null;
  licenseUrl: string | null;
};

export type SeedExercise = Exercise;

export function isBodyweightExercise(equipment: string | null | undefined): boolean {
  return equipment?.toLowerCase().includes("bodyweight") ?? false;
}
