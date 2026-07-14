/**
 * Never an error when bodyweight or a PR is missing — just not achieved
 * yet. Recomputed against whatever bodyweight is on file right now (not
 * bodyweight at the time the PR was set), so this is the one badge category
 * that can un-achieve if bodyweight later goes up — see plan.md (spec 010)
 * Design Decision 6.
 */
export function isRatioBadgeAchieved(
  bodyweight: number | null,
  bestWeightForExercise: number | undefined,
  multiplier: number
): boolean {
  if (bodyweight === null || bestWeightForExercise === undefined) {
    return false;
  }

  return bestWeightForExercise >= bodyweight * multiplier;
}
