import type { Exercise, MuscleGroupName } from "../../src/models/exercise";
import type { WgerExerciseInfo, WgerImage, WgerTranslation } from "./wgerClient";

const PLACEHOLDER_EXERCISE_IMAGE = "";

export type TransformWgerExerciseOptions = {
  id?: string;
  muscleGroupId?: MuscleGroupName;
  isWarmup?: boolean;
  localImagePath?: string;
  fallbackImagePath?: string;
};

function normalize(value: string | undefined | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function slugify(value: string): string {
  return normalize(value)
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function pickEnglishTranslation(translations: WgerTranslation[] = []): WgerTranslation | undefined {
  return translations.find((translation) => {
    const language = String(translation.language ?? translation.language_code ?? "").toLowerCase();

    return language === "2" || language === "en" || language === "english";
  }) ?? translations.find((translation) => translation.name);
}

function mapMuscleGroup(exercise: WgerExerciseInfo): MuscleGroupName {
  const candidates = [
    exercise.category?.name,
    ...(exercise.muscles ?? []).map((muscle) => muscle.name_en ?? muscle.name)
  ].map(normalize);

  if (candidates.some((candidate) => candidate.includes("chest"))) return "chest";
  if (candidates.some((candidate) => candidate.includes("back") || candidate.includes("lat"))) return "back";
  if (candidates.some((candidate) => candidate.includes("shoulder") || candidate.includes("deltoid"))) return "shoulders";
  if (candidates.some((candidate) => candidate.includes("biceps") || candidate.includes("triceps") || candidate.includes("arms"))) return "arms";
  if (candidates.some((candidate) => candidate.includes("abs") || candidate.includes("core") || candidate.includes("abdom"))) return "core";

  return "legs";
}

export function pickMainImage(images: WgerImage[] = []): WgerImage | undefined {
  return images.find((image) => image.is_main && image.image) ?? images.find((image) => image.image);
}

function pickVideoUrl(exercise: WgerExerciseInfo): string | null {
  const video = exercise.videos?.find((candidate) => candidate.video || candidate.url);

  return video?.video ?? video?.url ?? null;
}

export function transformWgerExercise(
  exercise: WgerExerciseInfo,
  options: TransformWgerExerciseOptions = {}
): Exercise {
  const translation = pickEnglishTranslation(exercise.translations);
  const name = translation?.name?.trim() || `Exercise ${exercise.id ?? exercise.uuid ?? "unknown"}`;
  const selectedImage = pickMainImage(exercise.images);
  const instructions = stripHtml(
    translation?.description || "Move slowly, keep control, and stop if anything feels painful."
  );

  return {
    id: options.id ?? slugify(name),
    name,
    muscleGroupId: options.muscleGroupId ?? mapMuscleGroup(exercise),
    equipment: exercise.equipment?.map((item) => item.name).filter(Boolean).join(", ") || null,
    imageUrl: options.localImagePath ?? options.fallbackImagePath ?? PLACEHOLDER_EXERCISE_IMAGE,
    instructions,
    isWarmup: options.isWarmup ?? false,
    videoUrl: pickVideoUrl(exercise),
    source: "wger",
    sourceId: exercise.uuid ?? (exercise.id !== undefined ? String(exercise.id) : null),
    licenseAuthor: selectedImage?.license_author ?? exercise.license_author ?? null,
    licenseUrl:
      selectedImage?.license_object_url ??
      selectedImage?.license_derivative_source_url ??
      selectedImage?.license_author_url ??
      null
  };
}
