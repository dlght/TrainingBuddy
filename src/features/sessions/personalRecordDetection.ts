export type SessionSetLogForPr = {
  exerciseId: string;
  weight: number | null;
  reps: number;
};

export type NewPersonalRecord = {
  exerciseId: string;
  weight: number;
  reps: number;
};

/**
 * At most one entry per exercise — that exercise's max weight *within this
 * session* — and only when it strictly exceeds every prior recorded best (or
 * the exercise has no prior record at all). Bodyweight sets (weight null)
 * never produce a PR. See plan.md (spec 010) Design Decisions 1-2 for why
 * this is evaluated once per session rather than per set.
 */
export function detectNewPersonalRecords(
  sessionSetLogs: SessionSetLogForPr[],
  priorBestByExercise: Map<string, number>
): NewPersonalRecord[] {
  const bestInSessionByExercise = new Map<string, { weight: number; reps: number }>();

  for (const setLog of sessionSetLogs) {
    if (!setLog.exerciseId || setLog.weight === null) {
      continue;
    }

    const current = bestInSessionByExercise.get(setLog.exerciseId);

    if (!current || setLog.weight > current.weight) {
      bestInSessionByExercise.set(setLog.exerciseId, { weight: setLog.weight, reps: setLog.reps });
    }
  }

  const newRecords: NewPersonalRecord[] = [];

  for (const [exerciseId, best] of bestInSessionByExercise) {
    const priorBest = priorBestByExercise.get(exerciseId);

    if (priorBest === undefined || best.weight > priorBest) {
      newRecords.push({ exerciseId, weight: best.weight, reps: best.reps });
    }
  }

  return newRecords;
}
