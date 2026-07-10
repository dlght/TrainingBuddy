import { transformWgerExercise } from "../../scripts/wger/transformWgerExercise";

describe("transformWgerExercise", () => {
  it("maps a wger exercise into app seed exercise shape", () => {
    const exercise = transformWgerExercise(
      {
        id: 123,
        uuid: "wger-push-up-uuid",
        category: { name: "Arms" },
        muscles: [{ name_en: "Triceps brachii" }],
        equipment: [{ name: "Bench" }, { name: "Dumbbell" }],
        translations: [
          { language_code: "de", name: "Liegestuetz", description: "Nicht verwenden" },
          {
            language_code: "en",
            name: "Incline Push-Up",
            description: "<p>Lower with control.</p><p>Press back up.</p>"
          }
        ],
        images: [
          {
            image: "https://example.test/push-up.webp",
            is_main: true,
            license_author: "Example Author",
            license_object_url: "https://example.test/license"
          }
        ],
        videos: [{ video: "https://example.test/video" }]
      },
      {
        isWarmup: true,
        localImagePath: "assets/seed-exercises/incline-push-up.webp"
      }
    );

    expect(exercise).toMatchObject({
      id: "incline-push-up",
      name: "Incline Push-Up",
      muscleGroupId: "arms",
      equipment: "Bench, Dumbbell",
      imageUrl: "assets/seed-exercises/incline-push-up.webp",
      instructions: "Lower with control. Press back up.",
      isWarmup: true,
      videoUrl: "https://example.test/video",
      source: "wger",
      sourceId: "wger-push-up-uuid",
      licenseAuthor: "Example Author",
      licenseUrl: "https://example.test/license"
    });
  });
});
