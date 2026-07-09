export type DashboardSetLog = {
  completedAt: string;
  reps: number;
  weight: number | null;
};

export type DailyVolumePoint = {
  label: string;
  dateKey: string;
  volume: number;
  setCount: number;
};

export type WeeklyDashboardStats = {
  days: DailyVolumePoint[];
  consistencyPercent: number;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastNDays(referenceDate: Date, count: number): Date[] {
  const days: Date[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const day = new Date(referenceDate);
    day.setDate(day.getDate() - offset);
    days.push(day);
  }

  return days;
}

/**
 * Derives the home dashboard's weekly volume bars and consistency percentage
 * from real local session data. Pure and clock-independent (referenceDate is
 * passed in) so it can be unit tested without mocking the system clock.
 */
export function calculateWeeklyDashboardStats(
  recentSetLogs: DashboardSetLog[],
  completedSessionDateKeys: string[],
  referenceDate: Date,
  dayCount = 6
): WeeklyDashboardStats {
  const days = lastNDays(referenceDate, dayCount);
  const volumeByDay = new Map<string, number>();
  const setCountByDay = new Map<string, number>();

  for (const setLog of recentSetLogs) {
    const key = setLog.completedAt.slice(0, 10);
    const volume = setLog.weight === null ? 0 : setLog.reps * setLog.weight;

    volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + volume);
    setCountByDay.set(key, (setCountByDay.get(key) ?? 0) + 1);
  }

  const dayPoints = days.map((day) => {
    const key = dateKey(day);

    return {
      label: WEEKDAY_LABELS[day.getDay()],
      dateKey: key,
      volume: volumeByDay.get(key) ?? 0,
      setCount: setCountByDay.get(key) ?? 0
    };
  });

  const activeDateKeys = new Set(completedSessionDateKeys.map((iso) => iso.slice(0, 10)));
  const activeDaysInWindow = days.filter((day) => activeDateKeys.has(dateKey(day))).length;
  const consistencyPercent = days.length === 0 ? 0 : Math.round((activeDaysInWindow / days.length) * 100);

  return { days: dayPoints, consistencyPercent };
}
