/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    __esModule: true,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), []);
    }
  };
});

jest.mock("@/features/profile/profileService", () => {
  const fakeProfileService = {
    getProfile: jest.fn().mockResolvedValue({
      id: "local-user",
      name: "Alex",
      bodyweight: 75,
      height: null,
      weightUnit: "kg",
      experienceLevel: "new",
      goal: "Build consistency",
      createdAt: "2026-07-06T00:00:00.000Z"
    })
  };

  return {
    profileService: fakeProfileService,
    createProfileService: () => fakeProfileService
  };
});

jest.mock("@/features/sessions/sessionService", () => ({
  sessionService: {
    resumeActiveSession: jest.fn().mockResolvedValue(null),
    discardSession: jest.fn()
  }
}));

jest.mock("@/features/workouts/workoutRecommendationService", () => ({
  workoutRecommendationService: {
    getSuggestedWorkouts: jest.fn().mockResolvedValue([{ id: "w1", name: "Starter Strength", isFavourite: false }])
  }
}));

jest.mock("@/features/progress/streakService", () => ({
  streakService: {
    getCurrentStreak: jest.fn().mockResolvedValue(4)
  }
}));

jest.mock("@/features/progress/dashboardService", () => ({
  dashboardService: {
    getWeeklyDashboardStats: jest.fn().mockResolvedValue({
      consistencyPercent: 50,
      days: [
        { label: "S", dateKey: "2026-07-05", volume: 0, setCount: 0 },
        { label: "M", dateKey: "2026-07-06", volume: 200, setCount: 3 },
        { label: "T", dateKey: "2026-07-07", volume: 0, setCount: 0 },
        { label: "W", dateKey: "2026-07-08", volume: 400, setCount: 5 },
        { label: "T", dateKey: "2026-07-09", volume: 0, setCount: 0 },
        { label: "F", dateKey: "2026-07-10", volume: 0, setCount: 0 }
      ]
    })
  }
}));

const mockGetProgress = jest.fn();

jest.mock("@/features/challenges/challengesService", () => ({
  challengesService: {
    getProgress: mockGetProgress
  }
}));

const HomeScreen = require("../../app/index").default;

const NO_BADGES_ACHIEVED = {
  lifetimeWorkoutCount: 0,
  longestStreakDays: 0,
  badges: [
    { id: "lifetime-workouts-10", category: "lifetime_workouts", threshold: 10, label: "10 workouts", achieved: false },
    { id: "streak-1", category: "streak", threshold: 1, label: "1 day streak", achieved: false }
  ]
};

const SOME_BADGES_ACHIEVED = {
  lifetimeWorkoutCount: 15,
  longestStreakDays: 3,
  badges: [
    { id: "lifetime-workouts-10", category: "lifetime_workouts", threshold: 10, label: "10 workouts", achieved: true },
    { id: "lifetime-workouts-50", category: "lifetime_workouts", threshold: 50, label: "50 workouts", achieved: false },
    { id: "lifetime-workouts-100", category: "lifetime_workouts", threshold: 100, label: "100 workouts", achieved: false },
    { id: "streak-1", category: "streak", threshold: 1, label: "1 day streak", achieved: true },
    { id: "streak-7", category: "streak", threshold: 7, label: "7 day streak", achieved: false }
  ]
};

describe("Dashboard (home) screen", () => {
  beforeEach(() => {
    mockGetProgress.mockReset();
    mockGetProgress.mockResolvedValue(SOME_BADGES_ACHIEVED);
  });

  it("shows both consistency and streak tiles fully rendered", async () => {
    const view = await render(<HomeScreen />);

    expect(await view.findByText("consistency")).toBeOnTheScreen();
    expect(view.getByText("day streak")).toBeOnTheScreen();
    expect(view.getByText("🔥 4")).toBeOnTheScreen();
  });

  it("shows that day's sets/volume when a trend chart bar is tapped", async () => {
    const view = await render(<HomeScreen />);

    expect(await view.findByText("Workout trend")).toBeOnTheScreen();
    expect(view.queryByText(/sets ·/)).toBeNull();

    await fireEvent.press(view.getByLabelText("View details for W"));
    expect(await view.findByText("5 sets · 400 volume")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("View details for M"));
    expect(await view.findByText("3 sets · 200 volume")).toBeOnTheScreen();
  });

  it("shows a badge shelf with an earned count once a badge is earned", async () => {
    const view = await render(<HomeScreen />);

    expect(await view.findByText(/of 5 badges earned/)).toBeOnTheScreen();
    expect(view.getByText("2")).toBeOnTheScreen();
    // 2 achieved medallions plus the bottom-nav "Challenges" icon, which also uses 🏆.
    expect(view.getAllByText("🏆")).toHaveLength(3);
    expect(view.getAllByText("🔒")).toHaveLength(3);
    expect(view.queryByText("Start working out to earn badges.")).toBeNull();
  });

  it("shows a prompt instead of a badge shelf when no badges are achieved yet", async () => {
    mockGetProgress.mockResolvedValue(NO_BADGES_ACHIEVED);

    const view = await render(<HomeScreen />);

    expect(await view.findByText("Start working out to earn badges.")).toBeOnTheScreen();
    expect(view.queryByText(/badges earned/)).toBeNull();
  });
});
