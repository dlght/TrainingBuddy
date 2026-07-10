import { computeLongestStreakDays, computeStreakDays } from "@/features/progress/streak";

const TODAY = "2026-07-09T08:00:00.000Z";

describe("computeStreakDays", () => {
  it("returns 0 when there are no completed sessions", () => {
    expect(computeStreakDays([], TODAY)).toBe(0);
  });

  it("returns 1 for a single session today", () => {
    expect(computeStreakDays(["2026-07-09T07:00:00.000Z"], TODAY)).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    const sessions = [
      "2026-07-09T07:00:00.000Z",
      "2026-07-08T18:00:00.000Z",
      "2026-07-07T18:00:00.000Z"
    ];

    expect(computeStreakDays(sessions, TODAY)).toBe(3);
  });

  it("dedupes multiple sessions on the same day to one day", () => {
    const sessions = [
      "2026-07-09T07:00:00.000Z",
      "2026-07-09T19:00:00.000Z",
      "2026-07-08T18:00:00.000Z"
    ];

    expect(computeStreakDays(sessions, TODAY)).toBe(2);
  });

  it("resets to the post-gap run when a day is skipped", () => {
    const sessions = [
      "2026-07-09T07:00:00.000Z",
      "2026-07-08T18:00:00.000Z",
      // gap on 2026-07-07
      "2026-07-06T18:00:00.000Z",
      "2026-07-05T18:00:00.000Z"
    ];

    expect(computeStreakDays(sessions, TODAY)).toBe(2);
  });

  it("still reports the streak when yesterday has a session but today does not yet", () => {
    const sessions = ["2026-07-08T18:00:00.000Z", "2026-07-07T18:00:00.000Z"];

    expect(computeStreakDays(sessions, TODAY)).toBe(2);
  });

  it("returns 0 when the most recent session is two or more days ago", () => {
    const sessions = ["2026-07-06T18:00:00.000Z"];

    expect(computeStreakDays(sessions, TODAY)).toBe(0);
  });

  it("ignores unparseable timestamps rather than throwing", () => {
    expect(computeStreakDays(["not-a-date", "2026-07-09T07:00:00.000Z"], TODAY)).toBe(1);
  });
});

describe("computeLongestStreakDays", () => {
  it("returns 0 for an empty history", () => {
    expect(computeLongestStreakDays([])).toBe(0);
  });

  it("returns 1 for a single session", () => {
    expect(computeLongestStreakDays(["2026-07-09T07:00:00.000Z"])).toBe(1);
  });

  it("finds a run that isn't at the end of the history", () => {
    const sessions = [
      // A 4-day run in the middle of the year, long since over...
      "2026-03-01T18:00:00.000Z",
      "2026-03-02T18:00:00.000Z",
      "2026-03-03T18:00:00.000Z",
      "2026-03-04T18:00:00.000Z",
      // ...followed by a much shorter, more recent 2-day run.
      "2026-07-08T18:00:00.000Z",
      "2026-07-09T07:00:00.000Z"
    ];

    expect(computeLongestStreakDays(sessions)).toBe(4);
  });

  it("dedupes multiple sessions on the same day to one day", () => {
    const sessions = [
      "2026-07-08T07:00:00.000Z",
      "2026-07-08T19:00:00.000Z",
      "2026-07-09T07:00:00.000Z"
    ];

    expect(computeLongestStreakDays(sessions)).toBe(2);
  });

  it("resets the running count across a gap", () => {
    const sessions = [
      "2026-07-05T18:00:00.000Z",
      "2026-07-06T18:00:00.000Z",
      // gap on 2026-07-07
      "2026-07-08T18:00:00.000Z",
      "2026-07-09T07:00:00.000Z"
    ];

    expect(computeLongestStreakDays(sessions)).toBe(2);
  });

  it("stays at its peak even when the history's most recent run is shorter", () => {
    // This is the "streak badge stays earned after a reset" property (FR-014):
    // once a 5-day run happened, appending only a 1-day run afterward must
    // not lower the result below 5.
    const sessions = [
      "2026-01-01T18:00:00.000Z",
      "2026-01-02T18:00:00.000Z",
      "2026-01-03T18:00:00.000Z",
      "2026-01-04T18:00:00.000Z",
      "2026-01-05T18:00:00.000Z",
      "2026-07-09T07:00:00.000Z"
    ];

    expect(computeLongestStreakDays(sessions)).toBe(5);
  });

  it("ignores unparseable timestamps rather than throwing", () => {
    expect(computeLongestStreakDays(["not-a-date", "2026-07-09T07:00:00.000Z"])).toBe(1);
  });
});
