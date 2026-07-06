export type WeightUnit = "kg" | "lb";

export type ExperienceLevel = "new" | "some_experience" | "returning";

export type UserProfile = {
  id: string;
  name: string;
  bodyweight: number;
  height: number | null;
  weightUnit: WeightUnit;
  experienceLevel: ExperienceLevel;
  goal: string;
  createdAt: string;
};

export type SaveUserProfileInput = Omit<UserProfile, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};
