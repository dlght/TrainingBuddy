export type WorkoutSessionStatus = "active" | "completed" | "discarded";

export type WorkoutSession = {
  id: string;
  workoutId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  status: WorkoutSessionStatus;
  workoutNameSnapshot: string;
};

export type SetLog = {
  id: string;
  sessionId: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  effortRpe: number;
  completedAt: string;
  exerciseNameSnapshot: string;
  targetRepsSnapshot: string | null;
  targetRestSecondsSnapshot: number | null;
};

export type CreateSetLogInput = Omit<SetLog, "id" | "completedAt"> & {
  id?: string;
  completedAt?: string;
};

export type ExerciseHistorySet = {
  sessionId: string;
  workoutNameSnapshot: string;
  completedAt: string;
  setNumber: number;
  reps: number;
  weight: number;
  effortRpe: number;
  exerciseNameSnapshot: string;
};

export type ExerciseVolumePoint = {
  sessionId: string;
  completedAt: string;
  volume: number;
};

export type ExerciseWeightPoint = {
  sessionId: string;
  completedAt: string;
  weight: number;
};
