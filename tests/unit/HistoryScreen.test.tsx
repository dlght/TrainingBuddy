/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from "@testing-library/react-native";

const mockListCompletedSessions = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    __esModule: true,
    useRouter: () => ({ push: jest.fn() }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), []);
    }
  };
});

jest.mock("@/features/progress/historyService", () => ({
  historyService: {
    listCompletedSessions: mockListCompletedSessions
  }
}));

const HistoryScreen = require("../../app/history/index").default;

describe("HistoryScreen", () => {
  beforeEach(() => {
    mockListCompletedSessions.mockReset();
  });

  it("shows each session's duration and effort rating", async () => {
    mockListCompletedSessions.mockResolvedValue([
      {
        id: "s1",
        workoutId: "w1",
        workoutName: "Leg Day",
        startedAt: "2026-07-06T10:00:00.000Z",
        endedAt: "2026-07-06T10:45:00.000Z",
        totalSets: 12,
        totalVolume: 1200,
        rating: 4
      },
      {
        id: "s2",
        workoutId: "w1",
        workoutName: "Push Day",
        startedAt: "2026-07-05T09:00:00.000Z",
        endedAt: "2026-07-05T09:20:00.000Z",
        totalSets: 8,
        totalVolume: 600,
        rating: null
      }
    ]);

    const view = await render(<HistoryScreen />);

    expect(await view.findByText(/45m 00s/)).toBeOnTheScreen();
    expect(view.getByText("😣 Almost couldn't do it")).toBeOnTheScreen();

    expect(await view.findByText(/20m 00s/)).toBeOnTheScreen();
    expect(view.getByText("— Not rated")).toBeOnTheScreen();
  });

  it("shows an empty state when there are no completed sessions", async () => {
    mockListCompletedSessions.mockResolvedValue([]);

    const view = await render(<HistoryScreen />);

    expect(await view.findByText("No workouts finished yet")).toBeOnTheScreen();
  });
});
