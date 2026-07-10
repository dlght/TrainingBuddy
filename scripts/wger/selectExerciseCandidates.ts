import type { Exercise } from "../../src/models/exercise";
import { pickEnglishTranslation, pickMainImage, transformWgerExercise } from "./transformWgerExercise";
import type { WgerExerciseInfo } from "./wgerClient";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Filters raw wger results down to those with a real English name and a real
 * photo (excludes anything that would otherwise silently fall back to a
 * placeholder), transforms the survivors, and de-duplicates against both the
 * supplied existing ids/names and the rest of the batch: a slug collision
 * gets `-2`, `-3`, etc. appended, but a *name* collision (the `exercises`
 * table has a `unique` constraint on `name`, not just `id`) is skipped
 * outright rather than renamed, since a manufactured "Leg Extension (2)"
 * isn't a real distinguishing name.
 */
export function selectExerciseCandidates(
  wgerExercises: WgerExerciseInfo[],
  existingIds: ReadonlySet<string>,
  existingNames: ReadonlySet<string> = new Set()
): Exercise[] {
  const usedIds = new Set(existingIds);
  const usedNames = new Set([...existingNames].map(normalizeName));
  const candidates: Exercise[] = [];

  for (const wgerExercise of wgerExercises) {
    const translation = pickEnglishTranslation(wgerExercise.translations);

    if (!translation?.name?.trim()) {
      continue;
    }

    const normalizedName = normalizeName(translation.name);

    if (usedNames.has(normalizedName)) {
      continue;
    }

    const image = pickMainImage(wgerExercise.images);

    if (!image?.image) {
      continue;
    }

    const exercise = transformWgerExercise(wgerExercise, { fallbackImagePath: image.image });

    let id = exercise.id;
    let suffix = 2;

    while (usedIds.has(id)) {
      id = `${exercise.id}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(id);
    usedNames.add(normalizedName);
    candidates.push({ ...exercise, id });
  }

  return candidates;
}
