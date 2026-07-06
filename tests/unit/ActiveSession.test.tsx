/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockCompleteSession = jest.fn();
const mockLogSet = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useLocalSearchParams: () => ({ workoutId: "workout-1" }),
  useRouter: () => ({ replace: mockReplace })
}));

jest.mock("@/features/sessions/sessionService", () => ({
  sessionService: {
    startWorkoutSession: jest.fn().mockResolvedValue({
      session: {
        id: "session-1",
        workoutId: "workout-1",
        userId: "local-user",
        startedAt: "2026-07-06T10:00:00.000Z",
        endedAt: null,
        status: "active",
        workoutNameSnapshot: "Starter Strength"
      },
      workout: {
        id: "workout-1",
        name: "Starter Strength",
        userId: "local-user",
        createdAt: "2026-07-06T09:00:00.000Z",
        isTemplate: false,
        sourceTemplateId: null,
        exercises: []
      },
      exercises: [
        {
          id: "we-1",
          workoutId: "workout-1",
          exerciseId: "bodyweight-squat",
          orderIndex: 0,
          targetSets: 1,
          targetRepRangeLow: 8,
          targetRepRangeHigh: 12,
          targetRestSeconds: 60,
          supersetGroupId: null,
          exerciseName: "Bodyweight Squat",
          loggedSetCount: 0
        },
        {
          id: "we-2",
          workoutId: "workout-1",
          exerciseId: "incline-push-up",
          orderIndex: 1,
          targetSets: 1,
          targetRepRangeLow: 6,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          supersetGroupId: null,
          exerciseName: "Incline Push-Up",
          loggedSetCount: 0
        }
      ],
      setLogs: []
    }),
    resumeActiveSession: jest.fn().mockResolvedValue(null),
    completeSession: mockCompleteSession,
    discardSession: jest.fn()
  }
}));

jest.mock("@/features/sessions/setLogService", () => ({
  setLogService: {
    logSet: mockLogSet
  }
}));

const ActiveSessionScreen = require("../../app/workouts/[workoutId]/session").default;

describe("ActiveSession screen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockCompleteSession.mockReset();
    mockLogSet.mockReset();
    mockLogSet.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      workoutExerciseId: "we-1",
      setNumber: 1,
      reps: 10,
      weight: 25,
      completedAt: "2026-07-06T10:05:00.000Z",
      exerciseNameSnapshot: "Bodyweight Squat",
      targetRepsSnapshot: "8-12",
      targetRestSecondsSnapshot: 60
    });
    mockCompleteSession.mockResolvedValue({
      session: { id: "session-1", status: "completed" },
      workout: { id: "workout-1" },
      exercises: [],
      setLogs: []
    });
  });

  it("logs a set, starts/skips rest, steps through exercises, and finishes", async () => {
    const view = await render(<ActiveSessionScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();
    expect(view.getByText("Rest 01:30")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Reps"), "10");
    await fireEvent.changeText(view.getByLabelText("Weight"), "25");
    await fireEvent.press(view.getByLabelText("Submit set log"));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith({
      sessionId: "session-1",
      workoutExerciseId: "we-1",
      reps: "10",
      weight: "25"
    });

    expect(await view.findByText("Rest running")).toBeOnTheScreen();
    await fireEvent.press(view.getByText("Skip rest"));
    expect(view.getByText("Rest ready")).toBeOnTheScreen();

    await fireEvent.press(view.getByText("Next"));
    expect(view.getByText("Incline Push-Up")).toBeOnTheScreen();

    await fireEvent.press(view.getByText("Finish session"));
    await waitFor(() => expect(mockCompleteSession).toHaveBeenCalledWith("session-1"));
    expect(mockReplace).toHaveBeenCalledWith("/workouts/workout-1");
  });
});
