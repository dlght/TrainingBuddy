/* eslint-disable @typescript-eslint/no-require-imports */
import { render, waitFor } from "@testing-library/react-native";

const mockGetProgress = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    __esModule: true,
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), []);
    }
  };
});

jest.mock("@/features/challenges/challengesService", () => ({
  challengesService: {
    getProgress: mockGetProgress
  }
}));

const ChallengesScreen = require("../../app/challenges/index").default;

describe("ChallengesScreen", () => {
  beforeEach(() => {
    mockGetProgress.mockReset();
  });

  it("shows lifetime and streak stats plus every badge, achieved and locked alike", async () => {
    mockGetProgress.mockResolvedValueOnce({
      lifetimeWorkoutCount: 15,
      longestStreakDays: 3,
      badges: [
        { id: "lifetime-workouts-10", category: "lifetime_workouts", threshold: 10, label: "10 workouts", achieved: true },
        { id: "lifetime-workouts-50", category: "lifetime_workouts", threshold: 50, label: "50 workouts", achieved: false },
        { id: "streak-1", category: "streak", threshold: 1, label: "1 day streak", achieved: true },
        { id: "streak-7", category: "streak", threshold: 7, label: "7 day streak", achieved: false }
      ]
    });

    const view = await render(<ChallengesScreen />);

    await waitFor(() => expect(view.getByText("15")).toBeOnTheScreen());
    expect(view.getByText("3")).toBeOnTheScreen();

    // Locked badges still render with their requirement, not hidden.
    expect(view.getByText("10 workouts")).toBeOnTheScreen();
    expect(view.getByText("50 workouts")).toBeOnTheScreen();
    expect(view.getByText("1 day streak")).toBeOnTheScreen();
    expect(view.getByText("7 day streak")).toBeOnTheScreen();
  });

  it("shows an error state when progress fails to load", async () => {
    mockGetProgress.mockRejectedValueOnce(new Error("network down"));

    const view = await render(<ChallengesScreen />);

    expect(await view.findByText("Challenges could not be loaded.")).toBeOnTheScreen();
  });
});
