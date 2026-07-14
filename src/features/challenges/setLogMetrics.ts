export type CompletedSetLogWithExercise = {
  sessionId: string;
  exerciseId: string;
  reps: number;
  weight: number | null;
};

/**
 * Sum of reps * weight across every given set. Bodyweight sets (weight
 * null) contribute nothing — consistent with how the rest of the app treats
 * bodyweight exercises as having no meaningful "weight lifted."
 */
export function sumLifetimeVolumeKg(sets: CompletedSetLogWithExercise[]): number {
  return sets.reduce((total, set) => (set.weight === null ? total : total + set.reps * set.weight), 0);
}

/**
 * Number of distinct sessions containing at least one set of the given
 * exercise — multiple sets of that exercise within the same session count
 * once, not once per set.
 */
export function countDistinctSessionsForExercise(sets: CompletedSetLogWithExercise[], exerciseId: string): number {
  const sessionIds = new Set(
    sets.filter((set) => set.exerciseId === exerciseId).map((set) => set.sessionId)
  );

  return sessionIds.size;
}
