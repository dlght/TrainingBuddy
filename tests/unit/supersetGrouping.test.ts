import { assignSupersetGroup, clearSupersetGroup } from "@/features/workouts/workoutValidation";

describe("superset grouping", () => {
  it("assigns the same group only to the selected exercises", () => {
    const exercises = [
      { exerciseId: "bodyweight-squat", supersetGroupId: null },
      { exerciseId: "incline-push-up", supersetGroupId: null },
      { exerciseId: "one-arm-dumbbell-row", supersetGroupId: null }
    ];

    const grouped = assignSupersetGroup(exercises, ["bodyweight-squat", "incline-push-up"], "superset-a");

    expect(grouped).toEqual([
      { exerciseId: "bodyweight-squat", supersetGroupId: "superset-a" },
      { exerciseId: "incline-push-up", supersetGroupId: "superset-a" },
      { exerciseId: "one-arm-dumbbell-row", supersetGroupId: null }
    ]);
  });

  it("requires at least two selected exercises", () => {
    expect(() =>
      assignSupersetGroup([{ exerciseId: "bodyweight-squat", supersetGroupId: null }], ["bodyweight-squat"])
    ).toThrow("Choose at least two exercises for a superset.");
  });

  it("clears a group from one exercise without changing the rest", () => {
    const cleared = clearSupersetGroup(
      [
        { exerciseId: "bodyweight-squat", supersetGroupId: "superset-a" },
        { exerciseId: "incline-push-up", supersetGroupId: "superset-a" }
      ],
      "bodyweight-squat"
    );

    expect(cleared).toEqual([
      { exerciseId: "bodyweight-squat", supersetGroupId: null },
      { exerciseId: "incline-push-up", supersetGroupId: "superset-a" }
    ]);
  });
});
