export type Workout = {
  id: string;
  name: string;
  userId: string | null;
  createdAt: string;
  isTemplate: boolean;
  sourceTemplateId: string | null;
  isFavourite: boolean;
};

export type WorkoutExercise = {
  id: string;
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetRepRangeLow: number;
  targetRepRangeHigh: number;
  targetRestSeconds: number;
  supersetGroupId: string | null;
};

export type WorkoutExerciseSeed = Omit<WorkoutExercise, "id" | "workoutId">;

export type WorkoutWithExercises = Workout & {
  exercises: WorkoutExercise[];
};

export type SeedWorkout = {
  id: string;
  name: string;
  exercises: WorkoutExerciseSeed[];
};

export type CreateWorkoutInput = {
  name: string;
  userId: string;
  sourceTemplateId?: string | null;
  exercises?: WorkoutExerciseSeed[];
};
