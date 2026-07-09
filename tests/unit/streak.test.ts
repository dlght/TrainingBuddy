import { computeStreakDays } from "@/features/progress/streak";

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
