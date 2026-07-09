/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockListCompletedSessionsInRange = jest.fn();
const mockListSetLogsForSession = jest.fn();
const mockGetProfile = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    __esModule: true,
    useRouter: () => ({ push: mockPush }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), []);
    }
  };
});

jest.mock("@/features/progress/historyService", () => ({
  historyService: {
    listCompletedSessionsInRange: mockListCompletedSessionsInRange,
    listSetLogsForSession: mockListSetLogsForSession
  }
}));

jest.mock("@/features/profile/profileService", () => ({
  profileService: {
    getProfile: mockGetProfile
  }
}));

const HistoryScreen = require("../../app/history/index").default;

const SET_LOGS_BY_SESSION: Record<string, { completedAt: string; workoutExerciseId: string }[]> = {
  "s-today": [
    { completedAt: "2026-07-15T09:20:00.000Z", workoutExerciseId: "we-1" },
    { completedAt: "2026-07-15T09:25:00.000Z", workoutExerciseId: "we-1" },
    { completedAt: "2026-07-15T09:35:00.000Z", workoutExerciseId: "we-2" }
  ],
  "s-morning": [{ completedAt: "2026-07-10T08:30:00.000Z", workoutExerciseId: "we-3" }],
  "s-evening": [
    { completedAt: "2026-07-10T17:35:00.000Z", workoutExerciseId: "we-4" },
    { completedAt: "2026-07-10T17:45:00.000Z", workoutExerciseId: "we-5" }
  ]
};

const JULY_SESSIONS = [
  {
    id: "s-today",
    workoutId: "w1",
    workoutName: "Leg Day",
    startedAt: "2026-07-15T09:15:00.000Z",
    endedAt: "2026-07-15T10:00:00.000Z",
    totalSets: 12,
    totalVolume: 1500,
    rating: 3
  },
  {
    id: "s-morning",
    workoutId: "w2",
    workoutName: "Push Day",
    startedAt: "2026-07-10T08:00:00.000Z",
    endedAt: "2026-07-10T09:00:00.000Z",
    totalSets: 10,
    totalVolume: 900,
    rating: null
  },
  {
    id: "s-evening",
    workoutId: "w3",
    workoutName: "Pull Day",
    startedAt: "2026-07-10T17:30:00.000Z",
    endedAt: "2026-07-10T18:00:00.000Z",
    totalSets: 8,
    totalVolume: 700,
    rating: 5
  }
];

describe("HistoryScreen (calendar)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-15T12:00:00.000Z"));
    mockListCompletedSessionsInRange.mockReset();
    mockListCompletedSessionsInRange.mockResolvedValue(JULY_SESSIONS);
    mockListSetLogsForSession.mockReset();
    mockListSetLogsForSession.mockImplementation((sessionId: string) =>
      Promise.resolve(SET_LOGS_BY_SESSION[sessionId] ?? [])
    );
    mockGetProfile.mockReset();
    mockGetProfile.mockResolvedValue({
      id: "local-user",
      name: "Alex",
      bodyweight: 75,
      height: null,
      weightUnit: "kg",
      experienceLevel: "new",
      goal: "Build consistency",
      createdAt: "2026-07-06T00:00:00.000Z"
    });
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the current month and auto-selects today's session when today has one", async () => {
    const view = await render(<HistoryScreen />);

    expect(await view.findByText("July 2026")).toBeOnTheScreen();
    expect(await view.findByText("Leg Day")).toBeOnTheScreen();
    expect(view.getByText(/45m 00s/)).toBeOnTheScreen();
  });

  it("shows all sessions for a marked day with more than one workout", async () => {
    const view = await render(<HistoryScreen />);
    await view.findByText("Leg Day");

    await fireEvent.press(view.getByLabelText("2026-07-10, workout logged"));

    expect(await view.findByText("Push Day")).toBeOnTheScreen();
    expect(view.getByText("Pull Day")).toBeOnTheScreen();
  });

  it("shows an honest empty state for an unmarked day", async () => {
    const view = await render(<HistoryScreen />);
    await view.findByText("Leg Day");

    await fireEvent.press(view.getByLabelText("2026-07-05"));

    expect(await view.findByText("No workout this day.")).toBeOnTheScreen();
    expect(view.queryByText("Leg Day")).toBeNull();
  });

  it("shows exercise count, volume with the user's weight unit, working time, and resting time", async () => {
    const view = await render(<HistoryScreen />);
    await view.findByText("Leg Day");

    // s-today: 2 exercises, 15m of gaps (resting), 30m working out of 45m total.
    expect(await view.findByText("2 exercises")).toBeOnTheScreen();
    expect(view.getByText("1500 kg volume")).toBeOnTheScreen();
    expect(view.getByText("Working 30m 00s")).toBeOnTheScreen();
    expect(view.getByText("Resting 15m 00s")).toBeOnTheScreen();
  });

  it("shows zero resting time and the full duration as working time for a single-set session", async () => {
    const view = await render(<HistoryScreen />);
    await view.findByText("Leg Day");

    await fireEvent.press(view.getByLabelText("2026-07-10, workout logged"));
    await view.findByText("Push Day");

    expect(await view.findByText("1 exercise")).toBeOnTheScreen();
    expect(view.getByText("Resting 0s")).toBeOnTheScreen();
    expect(view.getByText("Working 1h 00m")).toBeOnTheScreen();
  });

  it("uses the profile's configured weight unit", async () => {
    mockGetProfile.mockResolvedValue({
      id: "local-user",
      name: "Alex",
      bodyweight: 75,
      height: null,
      weightUnit: "lb",
      experienceLevel: "new",
      goal: "Build consistency",
      createdAt: "2026-07-06T00:00:00.000Z"
    });

    const view = await render(<HistoryScreen />);
    await view.findByText("Leg Day");

    expect(await view.findByText("1500 lb volume")).toBeOnTheScreen();
  });

  it("includes the year in the session date and labels the effort rating bubble", async () => {
    const view = await render(<HistoryScreen />);
    await view.findByText("Leg Day");

    // "July 2026" (month label) plus the session date line both contain the year.
    expect(view.getAllByText(/2026/).length).toBeGreaterThanOrEqual(2);
    expect(view.getByText("😅")).toBeOnTheScreen();
    expect(view.getByText("Right there")).toBeOnTheScreen();
  });

  it("navigates to the workout on tapping a session card", async () => {
    const view = await render(<HistoryScreen />);
    await view.findByText("Leg Day");

    await fireEvent.press(view.getByLabelText("Open Leg Day"));
    expect(mockPush).toHaveBeenCalledWith("/workouts/w1");
  });

  it("navigates month-to-month and reloads for the visible range", async () => {
    const view = await render(<HistoryScreen />);
    await view.findByText("July 2026");
    const callsAfterMount = mockListCompletedSessionsInRange.mock.calls.length;

    await fireEvent.press(view.getByLabelText("Next month"));

    await waitFor(() => expect(view.getByText("August 2026")).toBeOnTheScreen());
    expect(mockListCompletedSessionsInRange.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });
});
