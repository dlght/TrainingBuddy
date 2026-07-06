/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  __esModule: true,
  useLocalSearchParams: () => ({ exerciseId: "bodyweight-squat" })
}));

jest.mock("@/features/progress/progressService", () => ({
  progressService: {
    getExerciseProgress: jest.fn().mockResolvedValue({
      exercise: {
        id: "bodyweight-squat",
        name: "Bodyweight Squat",
        muscleGroupId: "legs",
        equipment: "bodyweight",
        imageUrl: "assets/seed-exercises/placeholder.txt",
        instructions: "Squat with control.",
        isWarmup: true,
        videoUrl: null,
        source: "wger",
        sourceId: "seed-bodyweight-squat",
        licenseAuthor: null,
        licenseUrl: null
      },
      historySets: [
        {
          sessionId: "session-1",
          workoutNameSnapshot: "Full Body A",
          completedAt: "2026-07-06T10:00:00.000Z",
          setNumber: 1,
          reps: 10,
          weight: 20,
          effortRpe: 7,
          exerciseNameSnapshot: "Bodyweight Squat"
        }
      ],
      sessions: [
        {
          sessionId: "session-1",
          workoutNameSnapshot: "Full Body A",
          completedAt: "2026-07-06T10:00:00.000Z",
          setCount: 1,
          totalVolume: 200,
          sets: []
        }
      ],
      volumePoints: [{ sessionId: "session-1", completedAt: "2026-07-06T10:00:00.000Z", volume: 200 }],
      weightPoints: [{ sessionId: "session-1", completedAt: "2026-07-06T10:00:00.000Z", weight: 20 }]
    })
  }
}));

const ExerciseProgressScreen = require("../../app/progress/[exerciseId]").default;

describe("ExerciseProgress screen", () => {
  it("shows history, set details, and trend charts without PR cards", async () => {
    const view = await render(<ExerciseProgressScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();
    expect(view.getByText("Session history")).toBeOnTheScreen();
    expect(view.getByText("Set history")).toBeOnTheScreen();
    expect(view.getByText("Weight trend")).toBeOnTheScreen();
    expect(view.getByText("Volume trend")).toBeOnTheScreen();
    expect(view.getByText("Set 1")).toBeOnTheScreen();
    expect(view.queryByText(/highest weight/i)).toBeNull();
    expect(view.queryByText(/one-rep max/i)).toBeNull();
    expect(view.queryByText(/1rm/i)).toBeNull();
  });
});
