import type { ExerciseHistorySet, ExerciseVolumePoint, ExerciseWeightPoint } from "@/models/session";

export type SessionHistorySummary = {
  sessionId: string;
  workoutNameSnapshot: string;
  completedAt: string;
  setCount: number;
  totalVolume: number;
  sets: ExerciseHistorySet[];
};

function sortHistorySets(historySets: ExerciseHistorySet[]): ExerciseHistorySet[] {
  return [...historySets].sort(
    (a, b) =>
      a.completedAt.localeCompare(b.completedAt) ||
      a.sessionId.localeCompare(b.sessionId) ||
      a.setNumber - b.setNumber
  );
}

function latestTimestamp(first: string, second: string): string {
  return first.localeCompare(second) >= 0 ? first : second;
}

export function groupHistorySetsBySession(historySets: ExerciseHistorySet[]): SessionHistorySummary[] {
  const grouped = new Map<string, SessionHistorySummary>();

  for (const set of sortHistorySets(historySets)) {
    const existing = grouped.get(set.sessionId);
    const setVolume = set.reps * set.weight;

    if (!existing) {
      grouped.set(set.sessionId, {
        sessionId: set.sessionId,
        workoutNameSnapshot: set.workoutNameSnapshot,
        completedAt: set.completedAt,
        setCount: 1,
        totalVolume: setVolume,
        sets: [set]
      });
      continue;
    }

    grouped.set(set.sessionId, {
      ...existing,
      completedAt: latestTimestamp(existing.completedAt, set.completedAt),
      setCount: existing.setCount + 1,
      totalVolume: existing.totalVolume + setVolume,
      sets: [...existing.sets, set]
    });
  }

  return Array.from(grouped.values()).sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

export function calculateVolumeBySession(historySets: ExerciseHistorySet[]): ExerciseVolumePoint[] {
  return groupHistorySetsBySession(historySets).map((session) => ({
    sessionId: session.sessionId,
    completedAt: session.completedAt,
    volume: session.totalVolume
  }));
}

export function calculateWeightTrendPoints(historySets: ExerciseHistorySet[]): ExerciseWeightPoint[] {
  return sortHistorySets(historySets).map((set) => ({
    sessionId: set.sessionId,
    completedAt: set.completedAt,
    weight: set.weight
  }));
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}
