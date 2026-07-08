import {
  validateWorkoutDraft,
  validateWorkoutExerciseTarget
} from "@/features/workouts/workoutValidation";

describe("workout validation", () => {
  it("accepts target values and normalizes numeric fields", () => {
    const result = validateWorkoutExerciseTarget({
      exerciseId: " bodyweight-squat ",
      targetSets: "3",
      targetRepRangeLow: "8",
      targetRepRangeHigh: "12",
      targetRestSeconds: "60",
      supersetGroupId: " superset-a "
    });

    expect(result).toEqual({
      errors: {},
      value: {
        exerciseId: "bodyweight-squat",
        targetSets: 3,
        targetRepRangeLow: 8,
        targetRepRangeHigh: 12,
        targetRestSeconds: 60,
        targetWeight: null,
        supersetGroupId: "superset-a"
      }
    });
  });

  it("accepts an optional target weight and rejects a negative one", () => {
    const withWeight = validateWorkoutExerciseTarget({
      exerciseId: "barbell-squat",
      targetSets: "3",
      targetRepRangeLow: "8",
      targetRepRangeHigh: "12",
      targetRestSeconds: "60",
      targetWeight: "42.5"
    });

    expect(withWeight.errors.targetWeight).toBeUndefined();
    expect(withWeight.value?.targetWeight).toBe(42.5);

    const blankWeight = validateWorkoutExerciseTarget({
      exerciseId: "barbell-squat",
      targetSets: "3",
      targetRepRangeLow: "8",
      targetRepRangeHigh: "12",
      targetRestSeconds: "60",
      targetWeight: ""
    });

    expect(blankWeight.errors.targetWeight).toBeUndefined();
    expect(blankWeight.value?.targetWeight).toBeNull();

    const negativeWeight = validateWorkoutExerciseTarget({
      exerciseId: "barbell-squat",
      targetSets: "3",
      targetRepRangeLow: "8",
      targetRepRangeHigh: "12",
      targetRestSeconds: "60",
      targetWeight: "-5"
    });

    expect(negativeWeight.errors.targetWeight).toBe("Weight must be 0 or more.");
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
          targetSets: "0",
          targetRepRangeLow: "12",
          targetRepRangeHigh: "8",
          targetRestSeconds: "-1",
          supersetGroupId: "superset-a"
        }
      ]
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toMatchObject({
      name: "Name this workout.",
      exerciseTargets: {
        0: {
          targetSets: "Sets must be a whole number above 0.",
          targetRepRangeHigh: "Rep range end must be at least the start.",
          targetRestSeconds: "Rest must be 0 seconds or more."
        }
      }
    });
  });

  it("rejects single-exercise supersets", () => {
    const result = validateWorkoutDraft({
      name: "Starter Strength",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetSets: "2",
          targetRepRangeLow: "8",
          targetRepRangeHigh: "12",
          targetRestSeconds: "60",
          supersetGroupId: "superset-a"
        }
      ]
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.supersets).toBe("Supersets need at least two exercises in the same group.");
  });
});
