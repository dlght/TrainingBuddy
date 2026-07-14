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
    };

export function resolveExerciseImage(exercise: Pick<Exercise, "imageUrl">): ResolvedExerciseImage {
  const imageUrl = exercise.imageUrl.trim();

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return {
      kind: "remote",
      uri: imageUrl
    };
  }

  return {
    kind: "placeholder",
    label: exercisePlaceholderLabel,
    path: imageUrl
  };
}
