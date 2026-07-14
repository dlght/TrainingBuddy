import { resolveExerciseImage } from "@/features/exercises/exerciseImageResolver";

describe("resolveExerciseImage", () => {
  it("uses placeholders for missing or non-remote image paths", () => {
    expect(resolveExerciseImage({ imageUrl: "" })).toMatchObject({ kind: "placeholder" });
    expect(resolveExerciseImage({ imageUrl: "assets/seed-exercises/placeholder.txt" })).toMatchObject({
      kind: "placeholder",
      path: "assets/seed-exercises/placeholder.txt"
    });
  });

  it("detects remote image URLs", () => {
    expect(resolveExerciseImage({ imageUrl: "https://example.test/squat.webp" })).toEqual({
      kind: "remote",
      uri: "https://example.test/squat.webp"
    });
  });
});
