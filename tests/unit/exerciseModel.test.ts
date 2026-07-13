import { isBodyweightExercise } from "@/models/exercise";

describe("isBodyweightExercise", () => {
  it("matches the curated seed's exact 'bodyweight' equipment value", () => {
    expect(isBodyweightExercise("bodyweight")).toBe(true);
  });

  it("matches wger's 'none (bodyweight exercise)' equipment value", () => {
    expect(isBodyweightExercise("none (bodyweight exercise)")).toBe(true);
  });

  it("matches a comma-joined equipment list that includes bodyweight", () => {
    expect(isBodyweightExercise("Gym mat, none (bodyweight exercise)")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isBodyweightExercise("Bodyweight")).toBe(true);
  });

  it("returns false for a weighted-equipment exercise", () => {
    expect(isBodyweightExercise("Dumbbell")).toBe(false);
  });

  it("returns false for null or undefined equipment", () => {
    expect(isBodyweightExercise(null)).toBe(false);
    expect(isBodyweightExercise(undefined)).toBe(false);
  });
});
