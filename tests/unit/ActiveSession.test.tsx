/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { useActiveSessionStore } from "@/state/activeSessionStore";

const mockReplace = jest.fn();
const mockCompleteSession = jest.fn();
const mockLogSet = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useLocalSearchParams: () => ({ workoutId: "workout-1" }),
  useRouter: () => ({ replace: mockReplace }),
  useNavigation: () => ({ addListener: () => () => {}, dispatch: jest.fn() })
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
          imageUrl: "",
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
          imageUrl: "",
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

const { sessionService: mockedSessionService } = require("@/features/sessions/sessionService");
const ActiveSessionScreen = require("../../app/workouts/[workoutId]/session").default;

describe("ActiveSession screen", () => {
  beforeEach(() => {
    useActiveSessionStore.getState().reset();
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

    // The Log Set button becomes the Skip Rest button while rest is running.
    expect(await view.findByLabelText("Skip rest")).toBeOnTheScreen();
    expect(view.queryByLabelText("Submit set log")).toBeNull();
    expect(view.getByLabelText("Skip rest").props.accessibilityState?.disabled).toBeFalsy();

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
    await fireEvent.press(view.getByText("Finish workout"));

    // Finish is one-tap: it saves and navigates away immediately, no intermediate confirmation screen.
    await waitFor(() =>
      expect(mockCompleteSession).toHaveBeenCalledWith("session-1", {
        rating: 4,
        endedAt: expect.any(String)
      })
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("only offers End workout and Discard while sets remain unlogged, never Finish workout directly", async () => {
    const view = await render(<ActiveSessionScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();
    expect(view.queryByText("Finish workout")).toBeNull();
    expect(view.getByLabelText("End workout early")).toBeOnTheScreen();
    expect(view.getByText("Discard session")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Reps"), "10");
    await fireEvent.changeText(view.getByLabelText("Weight"), "25");
    await fireEvent.press(view.getByLabelText("Submit set log"));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    // Still no direct Finish while resting after a set, with more exercises left.
    expect(view.queryByText("Finish workout")).toBeNull();
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

    await fireEvent.press(view.getByText("Finish workout"));
    await waitFor(() =>
      expect(mockCompleteSession).toHaveBeenCalledWith("session-1", {
        rating: null,
        endedAt: expect.any(String)
      })
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("backs out of ending early without changing anything", async () => {
    const view = await render(<ActiveSessionScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("End workout early"));
    expect(await view.findByLabelText("Confirm end workout early")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("Keep going"));

    expect(view.queryByLabelText("Confirm end workout early")).toBeNull();
    expect(view.queryByText("Workout complete")).toBeNull();
    expect(mockCompleteSession).not.toHaveBeenCalled();
    expect(view.getByText("Bodyweight Squat")).toBeOnTheScreen();
  });

  it("ends a workout early with no sets logged and still reaches the rating screen", async () => {
    const view = await render(<ActiveSessionScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("End workout early"));
    await fireEvent.press(view.getByLabelText("Confirm end workout early"));

    expect(await view.findByText("Workout complete")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("Rate effort 3: Right there"));
    await fireEvent.press(view.getByText("Finish workout"));

    await waitFor(() =>
      expect(mockCompleteSession).toHaveBeenCalledWith("session-1", {
        rating: 3,
        endedAt: expect.any(String)
      })
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("ends a workout early after logging only some sets, saving just what was logged", async () => {
    const view = await render(<ActiveSessionScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Reps"), "10");
    await fireEvent.changeText(view.getByLabelText("Weight"), "25");
    await fireEvent.press(view.getByLabelText("Submit set log"));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    await fireEvent.press(view.getByLabelText("Skip rest"));
    expect(await view.findByText("Incline Push-Up")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("End workout early"));
    await fireEvent.press(view.getByLabelText("Confirm end workout early"));

    expect(await view.findByText("Workout complete")).toBeOnTheScreen();

    await fireEvent.press(view.getByText("Finish workout"));

    await waitFor(() =>
      expect(mockCompleteSession).toHaveBeenCalledWith("session-1", {
        rating: null,
        endedAt: expect.any(String)
      })
    );
    expect(mockLogSet).toHaveBeenCalledTimes(1);
  });

  it("uses each exercise's own configured rest time after logging its set", async () => {
    mockedSessionService.startWorkoutSession.mockResolvedValueOnce({
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
          targetRestSeconds: 30,
          targetWeight: null,
          supersetGroupId: null,
          setPlans: [{ id: "plan-1", workoutExerciseId: "we-1", setNumber: 1, reps: 8, weight: null }],
          exerciseName: "Bodyweight Squat",
          imageUrl: "",
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
          targetRestSeconds: 90,
          targetWeight: 20,
          supersetGroupId: null,
          setPlans: [{ id: "plan-2", workoutExerciseId: "we-2", setNumber: 1, reps: 6, weight: 20 }],
          exerciseName: "Incline Push-Up",
          imageUrl: "",
          loggedSetCount: 0
        }
      ],
      setLogs: []
    });

    const view = await render(<ActiveSessionScreen />);
    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Reps"), "10");
    await fireEvent.changeText(view.getByLabelText("Weight"), "25");
    await fireEvent.press(view.getByLabelText("Submit set log"));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    // Bodyweight Squat is configured for 30s rest.
    expect(await view.findByText("Rest 00:30")).toBeOnTheScreen();

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
      targetRestSecondsSnapshot: 90
    });

    await fireEvent.changeText(view.getByLabelText("Reps"), "8");
    await fireEvent.changeText(view.getByLabelText("Weight"), "20");
    await fireEvent.press(view.getByLabelText("Submit set log"));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(2));

    // Incline Push-Up is configured for 90s rest — different from Bodyweight Squat's.
    expect(await view.findByText("Rest 01:30")).toBeOnTheScreen();
  });

  it("reaches the finish screen for a single-exercise, single-set workout without waiting out rest", async () => {
    mockedSessionService.startWorkoutSession.mockResolvedValueOnce({
      session: {
        id: "session-1",
        workoutId: "workout-1",
        userId: "local-user",
        startedAt: "2026-07-06T10:00:00.000Z",
        endedAt: null,
        status: "active",
        workoutNameSnapshot: "One And Done"
      },
      workout: {
        id: "workout-1",
        name: "One And Done",
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
          imageUrl: "",
          loggedSetCount: 0
        }
      ],
      setLogs: []
    });

    const view = await render(<ActiveSessionScreen />);
    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Reps"), "10");
    await fireEvent.changeText(view.getByLabelText("Weight"), "25");
    await fireEvent.press(view.getByLabelText("Submit set log"));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    // The only planned set is logged, but the workout isn't auto-marked
    // complete until rest is skipped/finished — "End workout early" is the
    // way to reach the finish screen without waiting on the rest timer.
    expect(view.queryByText("Workout complete")).toBeNull();

    await fireEvent.press(view.getByLabelText("End workout early"));
    await fireEvent.press(view.getByLabelText("Confirm end workout early"));

    expect(await view.findByText("Workout complete")).toBeOnTheScreen();

    await fireEvent.press(view.getByText("Finish workout"));

    await waitFor(() =>
      expect(mockCompleteSession).toHaveBeenCalledWith("session-1", {
        rating: null,
        endedAt: expect.any(String)
      })
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("shows a persistent timer at the top that keeps ticking while exercises are in progress", async () => {
    const view = await render(<ActiveSessionScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();
    // The timer bar is visible from the very start of the session, not only once complete.
    expect(view.getByText(/^\d+[hms]/)).toBeOnTheScreen();
  });

  it("stops the timer the instant the workout reaches the complete state", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-06T10:00:05.000Z"));

    try {
      const view = await render(<ActiveSessionScreen />);
      expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

      const initialText = view.getByText(/^\d+[hms]/).props.children;

      await act(() => {
        jest.advanceTimersByTime(3_000);
      });
      const tickingText = view.getByText(/^\d+[hms]/).props.children;
      expect(tickingText).not.toEqual(initialText);

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

      await act(() => {
        jest.advanceTimersByTime(5_000);
      });

      await fireEvent.press(view.getByLabelText("Skip rest"));
      expect(await view.findByText("Workout complete")).toBeOnTheScreen();

      const frozenText = view.getByText(/^\d+[hms]/).props.children;
      expect(frozenText).not.toEqual(tickingText);

      await act(() => {
        jest.advanceTimersByTime(10_000);
      });

      // The timer must not resume ticking once the workout is complete.
      expect(view.getByText(/^\d+[hms]/).props.children).toEqual(frozenText);
    } finally {
      jest.useRealTimers();
    }
  });
});
