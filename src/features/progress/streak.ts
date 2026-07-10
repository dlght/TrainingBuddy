function toLocalDateKey(iso: string): string | null {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + deltaDays);

  const shiftedYear = date.getFullYear();
  const shiftedMonth = String(date.getMonth() + 1).padStart(2, "0");
  const shiftedDay = String(date.getDate()).padStart(2, "0");

  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
}

/**
 * Counts immediately-consecutive calendar days (ending today or yesterday)
 * with at least one completed session. If today has no session yet but
 * yesterday does, the streak still reports the pre-existing run rather than
 * looking broken before today is even over; a day with no session on both
 * today and yesterday reports 0.
 */
export function computeStreakDays(endedAtIsoList: string[], todayLocalDateIso: string): number {
  const todayKey = toLocalDateKey(todayLocalDateIso);

  if (!todayKey) {
    return 0;
  }

  const workedOutDays = new Set(
    endedAtIsoList.map(toLocalDateKey).filter((key): key is string => key !== null)
  );

  let cursor: string;

  if (workedOutDays.has(todayKey)) {
    cursor = todayKey;
  } else {
    const yesterdayKey = shiftDateKey(todayKey, -1);

    if (workedOutDays.has(yesterdayKey)) {
      cursor = yesterdayKey;
    } else {
      return 0;
    }
  }

  let streak = 0;

  while (workedOutDays.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

/**
 * Longest run of consecutive calendar days with at least one completed
 * session, anywhere in the given history — not anchored to today the way
 * computeStreakDays is. Used for challenge streak badges, which must stay
 * achieved even after the account's current streak later resets.
 */
export function computeLongestStreakDays(endedAtIsoList: string[]): number {
  const workedOutDays = Array.from(
    new Set(endedAtIsoList.map(toLocalDateKey).filter((key): key is string => key !== null))
  ).sort();

  let longest = 0;
  let current = 0;
  let previousKey: string | null = null;

  for (const key of workedOutDays) {
    if (previousKey !== null && shiftDateKey(previousKey, 1) === key) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previousKey = key;
  }

  return longest;
}
