export type BadgeCategory =
  | "lifetime_workouts"
  | "streak"
  | "total_volume_kg"
  | "monthly_workout_count"
  | "exercise_session_count"
  | "pr_count"
  | "bodyweight_ratio";

export type Badge = {
  id: string;
  category: BadgeCategory;
  threshold: number;
  label: string;
  exerciseId: string | null;
  ratioMultiplier: number | null;
};

export type BadgeProgress = Badge & {
  achieved: boolean;
};
