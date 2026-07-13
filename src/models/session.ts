export type WorkoutSessionStatus = "active" | "paused" | "completed" | "discarded";

export type WorkoutSession = {
  id: string;
  workoutId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  status: WorkoutSessionStatus;
  workoutNameSnapshot: string;
  rating: number | null;
  pausedAt: string | null;
};

export type SetLog = {
  id: string;
  sessionId: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number | null;
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
  weight: number | null;
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
