import { render } from "@testing-library/react-native";

import { ExerciseCard } from "@/features/exercises/ExerciseCard";
import type { Exercise } from "@/models/exercise";

function buildExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "barbell-squat",
    name: "Barbell Squat",
    muscleGroupId: "legs",
    equipment: "barbell",
    imageUrl: "assets/seed-exercises/placeholder.txt",
    instructions: "Squat with a barbell.",
    isWarmup: false,
    videoUrl: null,
    source: "wger",
    sourceId: "seed-barbell-squat",
    licenseAuthor: null,
    licenseUrl: null,
    ...overrides
  };
}

describe("ExerciseCard", () => {
  it("shows the placeholder fallback when the exercise has no photo", async () => {
    const view = await render(<ExerciseCard exercise={buildExercise()} />);

    expect(view.getByText("Exercise image placeholder")).toBeOnTheScreen();
  });

  it("renders the actual photo when the exercise has a remote image URL", async () => {
    const imageUrl = "https://xchfgfceaxizeiqfrnjz.supabase.co/storage/v1/object/public/exercise-images/processed/barbell-squat.jpg";
    const view = await render(<ExerciseCard exercise={buildExercise({ imageUrl })} />);

    expect(view.queryByText("Exercise image placeholder")).toBeNull();
    expect(view.getByTestId("exercise-card-image").props.source).toEqual({ uri: imageUrl });
  });
});
