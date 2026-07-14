function toLocalMonthKey(iso: string): string | null {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

/**
 * Highest number of completed sessions found in any single calendar month,
 * anywhere in the given history — not "this month," so the badge stays
 * achieved even after a quiet month, matching computeLongestStreakDays'
 * monotonically-non-decreasing design for challenge badges.
 */
export function computeBestMonthlyWorkoutCount(endedAtIsoList: string[]): number {
  const countsByMonth = new Map<string, number>();

  for (const iso of endedAtIsoList) {
    const monthKey = toLocalMonthKey(iso);

    if (!monthKey) {
      continue;
    }

    countsByMonth.set(monthKey, (countsByMonth.get(monthKey) ?? 0) + 1);
  }

  return Math.max(0, ...countsByMonth.values());
}
