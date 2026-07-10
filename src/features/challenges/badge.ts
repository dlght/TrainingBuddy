export type BadgeCategory = "lifetime_workouts" | "streak";

export type Badge = {
  id: string;
  category: BadgeCategory;
  threshold: number;
  label: string;
};

export type BadgeProgress = Badge & {
  achieved: boolean;
};
