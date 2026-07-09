import { getElapsedSeconds } from "./duration";

export type SessionBreakdownSetLog = {
  completedAt: string;
  workoutExerciseId: string;
};

export type SessionBreakdown = {
  exerciseCount: number;
  workingSeconds: number;
  restingSeconds: number;
};

/**
 * Approximates working vs. resting time from data already recorded — no new
 * capture mechanism. Resting time is the sum of elapsed time between
 * consecutive logged sets (sorted by completedAt); working time is whatever
 * of the session's total duration isn't accounted for by those gaps. Works
 * retroactively for any already-completed session.
 */
export function computeSessionBreakdown(
  startedAt: string,
  endedAt: string,
  setLogs: SessionBreakdownSetLog[]
): SessionBreakdown {
  const exerciseCount = new Set(setLogs.map((setLog) => setLog.workoutExerciseId)).size;
  const totalSeconds = getElapsedSeconds(startedAt, endedAt);

  const sorted = [...setLogs].sort((a, b) => a.completedAt.localeCompare(b.completedAt));

  let restingSeconds = 0;

  for (let i = 1; i < sorted.length; i += 1) {
    restingSeconds += getElapsedSeconds(sorted[i - 1].completedAt, sorted[i].completedAt);
  }

  const workingSeconds = Math.max(0, totalSeconds - restingSeconds);

  return { exerciseCount, workingSeconds, restingSeconds };
}
