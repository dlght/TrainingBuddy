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
          targetWeight: null,
          supersetGroupId: null,
          setPlans: [{ id: "plan-1", workoutExerciseId: "we-1", setNumber: 1, reps: 8, weight: null }],
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
          targetWeight: 20,
          supersetGroupId: null,
          setPlans: [{ id: "plan-2", workoutExerciseId: "we-2", setNumber: 1, reps: 6, weight: 20 }],
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
      session: {
        id: "session-1",
        status: "completed",
        startedAt: "2026-07-06T10:00:00.000Z",
        endedAt: "2026-07-06T10:45:00.000Z"
      },
      workout: { id: "workout-1" },
      exercises: [],
      setLogs: []
    });
  });

  it("logs a set, starts/skips rest, auto-advances through exercises to a workout-complete state, and finishes", async () => {
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

    // Log Set is blocked while rest is running.
    expect(await view.findByText("Resting…")).toBeOnTheScreen();
    expect(view.getByLabelText("Submit set log").props.accessibilityState?.disabled).toBe(true);
    expect(view.getByLabelText("Skip rest").props.accessibilityState?.disabled).toBe(false);

    // Skipping rest after the exercise's only target set auto-advances to the next exercise.
    await fireEvent.press(view.getByLabelText("Skip rest"));
    expect(await view.findByText("Incline Push-Up")).toBeOnTheScreen();
    expect(view.getByLabelText("Submit set log").props.accessibilityState?.disabled).toBe(false);

    mockLogSet.mockResolvedValueOnce({
      id: "set-2",
      sessionId: "session-1",
      workoutExerciseId: "we-2",
      setNumber: 1,
      reps: 8,
      weight: 20,
      completedAt: "2026-07-06T10:10:00.000Z",
      exerciseNameSnapshot: "Incline Push-Up",
      targetRepsSnapshot: "6-10",
      targetRestSecondsSnapshot: 60
    });

    await fireEvent.changeText(view.getByLabelText("Reps"), "8");
    await fireEvent.changeText(view.getByLabelText("Weight"), "20");
    await fireEvent.press(view.getByLabelText("Submit set log"));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(2));

    // Skipping rest after the last set of the last exercise resolves to the workout-complete state.
    await fireEvent.press(view.getByLabelText("Skip rest"));
    expect(await view.findByText("Workout complete")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("Rate effort 4: Almost couldn't do it"));
    await fireEvent.press(view.getByText("Finish session"));
    await waitFor(() =>
      expect(mockCompleteSession).toHaveBeenCalledWith("session-1", { rating: 4 })
    );

    expect(await view.findByText("Session complete")).toBeOnTheScreen();
    expect(mockReplace).not.toHaveBeenCalled();

    await fireEvent.press(view.getByText("Done"));
    expect(mockReplace).toHaveBeenCalledWith("/workouts/workout-1");
  });

  it("finishes a session with no rating selected, saving null", async () => {
    const view = await render(<ActiveSessionScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Reps"), "10");
    await fireEvent.changeText(view.getByLabelText("Weight"), "25");
    await fireEvent.press(view.getByLabelText("Submit set log"));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    await fireEvent.press(view.getByLabelText("Skip rest"));
    expect(await view.findByText("Incline Push-Up")).toBeOnTheScreen();

    mockLogSet.mockResolvedValueOnce({
      id: "set-2",
      sessionId: "session-1",
      workoutExerciseId: "we-2",
      setNumber: 1,
      reps: 8,
      weight: 20,
      completedAt: "2026-07-06T10:10:00.000Z",
      exerciseNameSnapshot: "Incline Push-Up",
      targetRepsSnapshot: "6-10",
      targetRestSecondsSnapshot: 60
    });

    await fireEvent.changeText(view.getByLabelText("Reps"), "8");
    await fireEvent.changeText(view.getByLabelText("Weight"), "20");
    await fireEvent.press(view.getByLabelText("Submit set log"));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(2));

    await fireEvent.press(view.getByLabelText("Skip rest"));
    expect(await view.findByText("Workout complete")).toBeOnTheScreen();

    await fireEvent.press(view.getByText("Finish session"));
    await waitFor(() =>
      expect(mockCompleteSession).toHaveBeenCalledWith("session-1", { rating: null })
    );
    expect(await view.findByText("— Not rated")).toBeOnTheScreen();
  });
});
