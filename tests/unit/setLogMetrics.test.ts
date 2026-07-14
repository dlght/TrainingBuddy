import { countDistinctSessionsForExercise, sumLifetimeVolumeKg } from "@/features/challenges/setLogMetrics";

describe("sumLifetimeVolumeKg", () => {
  it("returns 0 for no sets", () => {
    expect(sumLifetimeVolumeKg([])).toBe(0);
  });

  it("sums reps * weight across sets", () => {
    const sets = [
      { sessionId: "s1", exerciseId: "barbell-squat", reps: 5, weight: 100 },
      { sessionId: "s1", exerciseId: "barbell-squat", reps: 5, weight: 100 }
    ];

    expect(sumLifetimeVolumeKg(sets)).toBe(1000);
  });

  it("ignores bodyweight sets (null weight)", () => {
    const sets = [
      { sessionId: "s1", exerciseId: "bodyweight-squat", reps: 10, weight: null },
      { sessionId: "s1", exerciseId: "barbell-squat", reps: 5, weight: 100 }
    ];

    expect(sumLifetimeVolumeKg(sets)).toBe(500);
  });
});

describe("countDistinctSessionsForExercise", () => {
  it("returns 0 when the exercise was never logged", () => {
    const sets = [{ sessionId: "s1", exerciseId: "barbell-squat", reps: 5, weight: 100 }];

    expect(countDistinctSessionsForExercise(sets, "barbell-bench-press")).toBe(0);
  });

  it("counts each session once, even with multiple sets of the exercise in it", () => {
    const sets = [
      { sessionId: "s1", exerciseId: "barbell-bench-press", reps: 5, weight: 60 },
      { sessionId: "s1", exerciseId: "barbell-bench-press", reps: 5, weight: 65 },
      { sessionId: "s2", exerciseId: "barbell-bench-press", reps: 5, weight: 60 },
      { sessionId: "s2", exerciseId: "barbell-squat", reps: 5, weight: 100 }
    ];

    expect(countDistinctSessionsForExercise(sets, "barbell-bench-press")).toBe(2);
  });
});
