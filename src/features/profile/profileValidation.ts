import type { ExperienceLevel, SaveUserProfileInput, UserProfile, WeightUnit } from "@/models/user";

export const experienceLevelOptions: { value: ExperienceLevel; label: string }[] = [
  { value: "new", label: "New" },
  { value: "some_experience", label: "Some experience" },
  { value: "returning", label: "Returning" }
];

export const goalOptions = [
  "Build consistency",
  "Get stronger",
  "Feel healthier"
] as const;

export type ProfileGoal = (typeof goalOptions)[number];

export type ProfileFormValues = {
  name: string;
  bodyweight: string;
  height: string;
  weightUnit: WeightUnit;
  experienceLevel: ExperienceLevel;
  goal: string;
};

export type ProfileValidationErrors = Partial<Record<keyof ProfileFormValues, string>>;

export type ProfileValidationResult = {
  isValid: boolean;
  errors: ProfileValidationErrors;
  value?: SaveUserProfileInput;
};

const validWeightUnits = new Set<WeightUnit>(["kg", "lb"]);
const validExperienceLevels = new Set<ExperienceLevel>(
  experienceLevelOptions.map((option) => option.value)
);

function parsePositiveNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function profileToFormValues(profile: UserProfile): ProfileFormValues {
  return {
    name: profile.name,
    bodyweight: String(profile.bodyweight),
    height: profile.height === null ? "" : String(profile.height),
    weightUnit: profile.weightUnit,
    experienceLevel: profile.experienceLevel,
    goal: profile.goal
  };
}

export function validateProfile(values: ProfileFormValues): ProfileValidationResult {
  const errors: ProfileValidationErrors = {};
  const name = values.name.trim();
  const goal = values.goal.trim();
  const bodyweight = parsePositiveNumber(values.bodyweight);
  const height = values.height.trim() ? parsePositiveNumber(values.height) : null;

  if (!name) {
    errors.name = "Add your name.";
  } else if (name.length > 60) {
    errors.name = "Keep your name under 60 characters.";
  }

  if (bodyweight === null) {
    errors.bodyweight = "Enter a bodyweight greater than 0.";
  }

  if (values.height.trim() && height === null) {
    errors.height = "Enter a height greater than 0, or leave it blank.";
  }

  if (!validWeightUnits.has(values.weightUnit)) {
    errors.weightUnit = "Choose kg or lb.";
  }

  if (!validExperienceLevels.has(values.experienceLevel)) {
    errors.experienceLevel = "Choose your experience level.";
  }

  if (!goal) {
    errors.goal = "Choose a goal.";
  }

  if (Object.keys(errors).length > 0 || bodyweight === null) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    value: {
      name,
      bodyweight,
      height,
      weightUnit: values.weightUnit,
      experienceLevel: values.experienceLevel,
      goal
    }
  };
}
