import { computeSessionBreakdown } from "@/features/sessions/sessionBreakdown";

const STARTED_AT = "2026-07-15T09:00:00.000Z";
const ENDED_AT = "2026-07-15T10:00:00.000Z"; // 3600s total

describe("computeSessionBreakdown", () => {
  it("counts distinct exercises from workoutExerciseId", () => {
    const result = computeSessionBreakdown(STARTED_AT, ENDED_AT, [
      { completedAt: "2026-07-15T09:10:00.000Z", workoutExerciseId: "we-1" },
      { completedAt: "2026-07-15T09:20:00.000Z", workoutExerciseId: "we-1" },
      { completedAt: "2026-07-15T09:30:00.000Z", workoutExerciseId: "we-2" }
    ]);

    expect(result.exerciseCount).toBe(2);
  });

  it("sums gaps between consecutive sets as resting time, remainder as working time", () => {
    const result = computeSessionBreakdown(STARTED_AT, ENDED_AT, [
      { completedAt: "2026-07-15T09:10:00.000Z", workoutExerciseId: "we-1" }, // 10m after start
      { completedAt: "2026-07-15T09:12:00.000Z", workoutExerciseId: "we-1" }, // gap 2m
      { completedAt: "2026-07-15T09:15:00.000Z", workoutExerciseId: "we-1" } // gap 3m
    ]);

    // gaps: 2m + 3m = 5m resting; total 60m; working = 55m
    expect(result.restingSeconds).toBe(5 * 60);
    expect(result.workingSeconds).toBe(55 * 60);
  });

  it("does not depend on input order — sorts by completedAt internally", () => {
    const result = computeSessionBreakdown(STARTED_AT, ENDED_AT, [
      { completedAt: "2026-07-15T09:15:00.000Z", workoutExerciseId: "we-1" },
      { completedAt: "2026-07-15T09:10:00.000Z", workoutExerciseId: "we-1" },
      { completedAt: "2026-07-15T09:12:00.000Z", workoutExerciseId: "we-1" }
    ]);

    expect(result.restingSeconds).toBe(5 * 60);
  });

  it("reports zero resting time and full duration as working time for a single logged set", () => {
    const result = computeSessionBreakdown(STARTED_AT, ENDED_AT, [
      { completedAt: "2026-07-15T09:10:00.000Z", workoutExerciseId: "we-1" }
    ]);

    expect(result.restingSeconds).toBe(0);
    expect(result.workingSeconds).toBe(3600);
    expect(result.exerciseCount).toBe(1);
  });

  it("reports zero for everything with no logged sets", () => {
    const result = computeSessionBreakdown(STARTED_AT, ENDED_AT, []);

    expect(result).toEqual({ exerciseCount: 0, workingSeconds: 3600, restingSeconds: 0 });
  });

  it("clamps working time at zero if gaps somehow exceed the total duration", () => {
    const result = computeSessionBreakdown(STARTED_AT, ENDED_AT, [
      { completedAt: "2026-07-15T09:00:00.000Z", workoutExerciseId: "we-1" },
      { completedAt: "2026-07-15T12:00:00.000Z", workoutExerciseId: "we-1" }
    ]);

    expect(result.workingSeconds).toBe(0);
  });
});
