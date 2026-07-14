import { detectNewPersonalRecords } from "@/features/sessions/personalRecordDetection";

describe("detectNewPersonalRecords", () => {
  it("records a first-ever PR when there is no prior best", () => {
    const result = detectNewPersonalRecords(
      [{ exerciseId: "barbell-squat", weight: 60, reps: 5 }],
      new Map()
    );

    expect(result).toEqual([{ exerciseId: "barbell-squat", weight: 60, reps: 5 }]);
  });

  it("records a new PR only when it strictly beats the prior best", () => {
    const beats = detectNewPersonalRecords(
      [{ exerciseId: "barbell-squat", weight: 65, reps: 5 }],
      new Map([["barbell-squat", 60]])
    );

    expect(beats).toEqual([{ exerciseId: "barbell-squat", weight: 65, reps: 5 }]);

    const ties = detectNewPersonalRecords(
      [{ exerciseId: "barbell-squat", weight: 60, reps: 5 }],
      new Map([["barbell-squat", 60]])
    );

    expect(ties).toEqual([]);

    const undershoots = detectNewPersonalRecords(
      [{ exerciseId: "barbell-squat", weight: 55, reps: 5 }],
      new Map([["barbell-squat", 60]])
    );

    expect(undershoots).toEqual([]);
  });

  it("returns at most one entry per exercise, using the session's best set for it", () => {
    const result = detectNewPersonalRecords(
      [
        { exerciseId: "barbell-squat", weight: 60, reps: 5 },
        { exerciseId: "barbell-squat", weight: 65, reps: 3 },
        { exerciseId: "barbell-squat", weight: 62, reps: 4 }
      ],
      new Map()
    );

    expect(result).toEqual([{ exerciseId: "barbell-squat", weight: 65, reps: 3 }]);
  });

  it("never produces a PR for bodyweight sets (null weight)", () => {
    const result = detectNewPersonalRecords(
      [{ exerciseId: "bodyweight-squat", weight: null, reps: 10 }],
      new Map()
    );

    expect(result).toEqual([]);
  });

  it("handles multiple distinct exercises independently in the same session", () => {
    const result = detectNewPersonalRecords(
      [
        { exerciseId: "barbell-squat", weight: 65, reps: 5 },
        { exerciseId: "barbell-bench-press", weight: 50, reps: 5 }
      ],
      new Map([["barbell-squat", 60]])
    );

    expect(result).toEqual(
      expect.arrayContaining([
        { exerciseId: "barbell-squat", weight: 65, reps: 5 },
        { exerciseId: "barbell-bench-press", weight: 50, reps: 5 }
      ])
    );
    expect(result).toHaveLength(2);
  });
});
