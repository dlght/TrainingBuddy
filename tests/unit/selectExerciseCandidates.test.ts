import { selectExerciseCandidates } from "../../scripts/wger/selectExerciseCandidates";
import type { WgerExerciseInfo } from "../../scripts/wger/wgerClient";

function buildWgerExercise(overrides: Partial<WgerExerciseInfo> = {}): WgerExerciseInfo {
  return {
    id: 1,
    uuid: "wger-1",
    category: { name: "Legs" },
    translations: [{ language_code: "en", name: "Bodyweight Lunge", description: "Lunge with control." }],
    images: [{ image: "https://example.test/lunge.webp", is_main: true }],
    ...overrides
  };
}

describe("selectExerciseCandidates", () => {
  it("keeps a valid entry with an English name and a main image", () => {
    const result = selectExerciseCandidates([buildWgerExercise()], new Set());

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "bodyweight-lunge", name: "Bodyweight Lunge" });
  });

  it("keeps a non-English translation when it's the only name available", () => {
    const result = selectExerciseCandidates(
      [buildWgerExercise({ translations: [{ language_code: "de", name: "Ausfallschritt" }] })],
      new Set()
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ausfallschritt");
  });

  it("excludes an entry with no usable name in any language", () => {
    const result = selectExerciseCandidates(
      [buildWgerExercise({ translations: [{ language_code: "de", name: "" }] })],
      new Set()
    );

    expect(result).toHaveLength(0);
  });

  it("excludes an entry with no picked main image", () => {
    const result = selectExerciseCandidates([buildWgerExercise({ images: [] })], new Set());

    expect(result).toHaveLength(0);
  });

  it("excludes an entry whose name collides with a supplied existing name (case-insensitive)", () => {
    const result = selectExerciseCandidates(
      [buildWgerExercise({ translations: [{ language_code: "en", name: "bodyweight LUNGE" }] })],
      new Set(),
      new Set(["Bodyweight Lunge"])
    );

    expect(result).toHaveLength(0);
  });

  it("de-duplicates a slug collision against the supplied existing ids", () => {
    const result = selectExerciseCandidates([buildWgerExercise()], new Set(["bodyweight-lunge"]));

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("bodyweight-lunge-2");
  });

  it("de-duplicates a slug collision within the same batch between two distinctly-named exercises", () => {
    const result = selectExerciseCandidates(
      [
        buildWgerExercise({
          id: 1,
          uuid: "wger-1",
          translations: [{ language_code: "en", name: "Push Up!" }]
        }),
        buildWgerExercise({
          id: 2,
          uuid: "wger-2",
          translations: [{ language_code: "en", name: "Push-Up" }]
        })
      ],
      new Set()
    );

    expect(result.map((exercise) => ({ id: exercise.id, name: exercise.name }))).toEqual([
      { id: "push-up", name: "Push Up!" },
      { id: "push-up-2", name: "Push-Up" }
    ]);
  });
});
