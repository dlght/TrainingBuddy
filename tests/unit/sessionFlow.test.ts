import { isSessionFullyLogged, resolveNextSessionStep } from "@/features/sessions/sessionFlow";

describe("resolveNextSessionStep", () => {
  it("stays on the same exercise when its target sets are not yet met", () => {
    const exercises = [
      { id: "e1", targetSets: 3, loggedSetCount: 1 },
      { id: "e2", targetSets: 2, loggedSetCount: 0 }
    ];

    expect(resolveNextSessionStep(exercises, 0)).toEqual({ type: "same-exercise" });
  });

  it("advances to the next exercise once the current one's target sets are met", () => {
    const exercises = [
      { id: "e1", targetSets: 3, loggedSetCount: 3 },
      { id: "e2", targetSets: 2, loggedSetCount: 0 }
    ];

    expect(resolveNextSessionStep(exercises, 0)).toEqual({ type: "next-exercise", index: 1 });
  });

  it("advances even when more sets than the target were logged", () => {
    const exercises = [
      { id: "e1", targetSets: 3, loggedSetCount: 4 },
      { id: "e2", targetSets: 2, loggedSetCount: 0 }
    ];

    expect(resolveNextSessionStep(exercises, 0)).toEqual({ type: "next-exercise", index: 1 });
  });

  it("resolves to workout-complete when the last exercise's target sets are met", () => {
    const exercises = [
      { id: "e1", targetSets: 3, loggedSetCount: 3 },
      { id: "e2", targetSets: 2, loggedSetCount: 2 }
    ];

    expect(resolveNextSessionStep(exercises, 1)).toEqual({ type: "workout-complete" });
  });

  it("resolves a single-exercise, single-set workout straight to workout-complete", () => {
    const exercises = [{ id: "e1", targetSets: 1, loggedSetCount: 1 }];

    expect(resolveNextSessionStep(exercises, 0)).toEqual({ type: "workout-complete" });
  });

  it("treats a missing current exercise as same-exercise (defensive default)", () => {
    const exercises = [{ id: "e1", targetSets: 1, loggedSetCount: 1 }];

    expect(resolveNextSessionStep(exercises, 5)).toEqual({ type: "same-exercise" });
  });
});

describe("isSessionFullyLogged", () => {
  it("is false for an empty exercise list", () => {
    expect(isSessionFullyLogged([])).toBe(false);
  });

  it("is false when any exercise still has unmet target sets", () => {
    const exercises = [
      { id: "e1", targetSets: 3, loggedSetCount: 3 },
      { id: "e2", targetSets: 2, loggedSetCount: 1 }
    ];

    expect(isSessionFullyLogged(exercises)).toBe(false);
  });

  it("is true when every exercise has met or exceeded its target sets", () => {
    const exercises = [
      { id: "e1", targetSets: 3, loggedSetCount: 3 },
      { id: "e2", targetSets: 2, loggedSetCount: 3 }
    ];

    expect(isSessionFullyLogged(exercises)).toBe(true);
  });
});
