import { computeBestMonthlyWorkoutCount } from "@/features/challenges/monthlyWorkoutCount";

describe("computeBestMonthlyWorkoutCount", () => {
  it("returns 0 for an empty history", () => {
    expect(computeBestMonthlyWorkoutCount([])).toBe(0);
  });

  it("counts sessions within the same calendar month", () => {
    const sessions = [
      "2026-03-01T18:00:00.000Z",
      "2026-03-15T18:00:00.000Z",
      "2026-03-30T18:00:00.000Z"
    ];

    expect(computeBestMonthlyWorkoutCount(sessions)).toBe(3);
  });

  it("returns the fullest month, not the most recent one", () => {
    const sessions = [
      // A busy March, long over...
      "2026-03-01T18:00:00.000Z",
      "2026-03-05T18:00:00.000Z",
      "2026-03-10T18:00:00.000Z",
      "2026-03-15T18:00:00.000Z",
      // ...followed by a quieter, more recent July.
      "2026-07-01T18:00:00.000Z",
      "2026-07-02T18:00:00.000Z"
    ];

    expect(computeBestMonthlyWorkoutCount(sessions)).toBe(4);
  });

  it("ignores unparseable timestamps rather than throwing", () => {
    expect(computeBestMonthlyWorkoutCount(["not-a-date", "2026-07-09T07:00:00.000Z"])).toBe(1);
  });
});
