import { calculateWeeklyDashboardStats } from "@/features/progress/dashboardStats";

describe("calculateWeeklyDashboardStats", () => {
  it("returns an honest zero state with no history", () => {
    const referenceDate = new Date("2026-07-08T12:00:00.000Z");
    const stats = calculateWeeklyDashboardStats([], [], referenceDate);

    expect(stats.consistencyPercent).toBe(0);
    expect(stats.days).toHaveLength(6);
    expect(stats.days.every((day) => day.volume === 0)).toBe(true);
  });

  it("sums volume per day and excludes bodyweight (null-weight) sets from volume", () => {
    const referenceDate = new Date("2026-07-08T12:00:00.000Z");
    const setLogs = [
      { completedAt: "2026-07-08T09:00:00.000Z", reps: 10, weight: 20 },
      { completedAt: "2026-07-08T09:05:00.000Z", reps: 5, weight: 30 },
      { completedAt: "2026-07-07T09:00:00.000Z", reps: 12, weight: null },
      { completedAt: "2026-01-01T09:00:00.000Z", reps: 100, weight: 100 }
    ];

    const stats = calculateWeeklyDashboardStats(setLogs, [], referenceDate);
    const today = stats.days[stats.days.length - 1];
    const yesterday = stats.days[stats.days.length - 2];

    expect(today.dateKey).toBe("2026-07-08");
    expect(today.volume).toBe(350);
    expect(yesterday.dateKey).toBe("2026-07-07");
    expect(yesterday.volume).toBe(0);
  });

  it("calculates consistency as the share of the window with a completed session", () => {
    const referenceDate = new Date("2026-07-08T12:00:00.000Z");
    const completedSessionDateKeys = [
      "2026-07-08T08:00:00.000Z",
      "2026-07-06T08:00:00.000Z",
      "2026-07-06T20:00:00.000Z"
    ];

    const stats = calculateWeeklyDashboardStats([], completedSessionDateKeys, referenceDate);

    expect(stats.consistencyPercent).toBe(Math.round((2 / 6) * 100));
  });

  it("labels each day with its actual weekday, not a fixed sequence", () => {
    const referenceDate = new Date("2026-07-08T12:00:00.000Z");
    const stats = calculateWeeklyDashboardStats([], [], referenceDate);

    expect(stats.days.map((day) => day.label)).toEqual(["F", "S", "S", "M", "T", "W"]);
    expect(stats.days.map((day) => day.dateKey)).toEqual([
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
      "2026-07-06",
      "2026-07-07",
      "2026-07-08"
    ]);
  });
});
