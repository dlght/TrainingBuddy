import type { Exercise } from "@/models/exercise";

export const exercisePlaceholderLabel = "Exercise image placeholder";

export type ResolvedExerciseImage =
  | {
      kind: "placeholder";
      label: string;
      path: string;
    }
  | {
      kind: "remote";
      uri: string;
    }
  | {
      kind: "local";
      path: string;
    };

const supportedImageExtensions = [".png", ".jpg", ".jpeg", ".webp"];

function hasImageExtension(path: string): boolean {
  const normalized = path.toLowerCase();

  return supportedImageExtensions.some((extension) => normalized.endsWith(extension));
}

export function resolveExerciseImage(exercise: Pick<Exercise, "imageUrl">): ResolvedExerciseImage {
  const imageUrl = exercise.imageUrl.trim();

  if (!imageUrl) {
    return {
      kind: "placeholder",
      label: exercisePlaceholderLabel,
      path: imageUrl
    };
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return {
      kind: "remote",
      uri: imageUrl
    };
  }

  if (!hasImageExtension(imageUrl)) {
    return {
      kind: "placeholder",
      label: exercisePlaceholderLabel,
      path: imageUrl
    };
  }

  return {
    kind: "local",
    path: imageUrl
  };
}
