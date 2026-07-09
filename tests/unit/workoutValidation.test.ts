import {
  validateWorkoutDraft,
  validateWorkoutExerciseTarget
} from "@/features/workouts/workoutValidation";

describe("workout validation", () => {
  it("accepts a uniform per-set plan and derives sets/rep-range/weight summaries", () => {
    const result = validateWorkoutExerciseTarget({
      exerciseId: " bodyweight-squat ",
      targetRestSeconds: "60",
      setPlans: [
        { reps: "8", weight: "" },
        { reps: "8", weight: "" },
        { reps: "8", weight: "" }
      ]
    });

    expect(result).toEqual({
      errors: {},
      value: {
        exerciseId: "bodyweight-squat",
        targetSets: 3,
        targetRepRangeLow: 8,
        targetRepRangeHigh: 8,
        targetRestSeconds: 60,
        targetWeight: null,
        supersetGroupId: null,
        setPlans: [
          { setNumber: 1, reps: 8, weight: null },
          { setNumber: 2, reps: 8, weight: null },
          { setNumber: 3, reps: 8, weight: null }
        ]
      }
    });
  });

  it("accepts a non-uniform per-set plan, deriving the rep range and using the first set's weight as the summary", () => {
    const result = validateWorkoutExerciseTarget({
      exerciseId: "barbell-squat",
      targetRestSeconds: "60",
      setPlans: [
        { reps: "10", weight: "15" },
        { reps: "12", weight: "12" }
      ]
    });

    expect(result.errors).toEqual({});
    expect(result.value).toMatchObject({
      targetSets: 2,
      targetRepRangeLow: 10,
      targetRepRangeHigh: 12,
      targetWeight: 15,
      setPlans: [
        { setNumber: 1, reps: 10, weight: 15 },
        { setNumber: 2, reps: 12, weight: 12 }
      ]
    });
  });

  it("rejects a negative weight on any set", () => {
    const result = validateWorkoutExerciseTarget({
      exerciseId: "barbell-squat",
      targetRestSeconds: "60",
      setPlans: [
        { reps: "10", weight: "15" },
        { reps: "10", weight: "-5" }
      ]
    });

    expect(result.errors.setPlans).toBe("Each set needs reps above 0 and a weight of 0 or more.");
    expect(result.value).toBeUndefined();
  });

  it("rejects zero reps on any set", () => {
    const result = validateWorkoutExerciseTarget({
      exerciseId: "barbell-squat",
      targetRestSeconds: "60",
      setPlans: [{ reps: "0", weight: null }]
    });

    expect(result.errors.setPlans).toBe("Each set needs reps above 0 and a weight of 0 or more.");
  });

  it("requires at least one planned set", () => {
    const result = validateWorkoutExerciseTarget({
      exerciseId: "barbell-squat",
      targetRestSeconds: "60",
      setPlans: []
    });

    expect(result.errors.setPlans).toBe("Add at least one set.");
  });

  it("rejects empty workouts before they can be saved or started", () => {
    const result = validateWorkoutDraft({
      name: "Starter Strength",
      exercises: []
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.exercises).toBe("Add at least one exercise before saving.");
  });

  it("rejects invalid targets", () => {
    const result = validateWorkoutDraft({
      name: " ",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetRestSeconds: "-1",
          setPlans: [{ reps: "0", weight: null }]
        }
      ]
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toMatchObject({
      name: "Name this workout.",
      exerciseTargets: {
        0: {
          setPlans: "Each set needs reps above 0 and a weight of 0 or more.",
          targetRestSeconds: "Rest must be 0 seconds or more."
        }
      }
    });
  });
});
