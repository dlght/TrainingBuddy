/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from "@testing-library/react-native";

import ExerciseLibraryScreen from "../../app/exercises";
import ExerciseDetailScreen from "../../app/exercises/[exerciseId]";
import HistoryScreen from "../../app/history";
import HomeScreen from "../../app/index";
import ProgressScreen from "../../app/progress/[exerciseId]";
import ProfileSetupScreen from "../../app/profile/setup";
import ActiveSessionScreen from "../../app/workouts/[workoutId]/session";
import WorkoutDetailScreen from "../../app/workouts/[workoutId]";
import NewWorkoutScreen from "../../app/workouts/new";
import WorkoutsScreen from "../../app/workouts";

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    __esModule: true,
    Link: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children),
    useRouter: () => ({ replace: jest.fn() }),
    useLocalSearchParams: () => ({ exerciseId: "placeholder" }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), []);
    }
  };
});

jest.mock("@/features/profile/profileService", () => ({
  profileService: {
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
  }
}));

jest.mock("@/features/exercises/exerciseLibraryService", () => ({
  exerciseLibraryService: {
    getLibraryData: jest.fn().mockResolvedValue({
      muscleGroups: [],
      exercises: [],
      groupedExercises: [],
      defaultMuscleGroupId: null
    }),
    listExercisesByMuscleGroup: jest.fn().mockResolvedValue([]),
    getExerciseById: jest.fn().mockResolvedValue(null)
  }
}));

jest.mock("@/features/workouts/workoutListService", () => ({
  workoutListService: {
    listWorkouts: jest.fn().mockResolvedValue({
      sampleWorkouts: [],
      customWorkouts: []
    })
  }
}));

jest.mock("@/features/workouts/workoutBuilderService", () => ({
  workoutBuilderService: {
    getWorkout: jest.fn().mockResolvedValue(null),
    createCustomWorkout: jest.fn(),
    updateCustomWorkout: jest.fn(),
    deleteCustomWorkout: jest.fn(),
    copyTemplateWorkout: jest.fn()
  }
}));

jest.mock("@/features/sessions/sessionService", () => ({
  sessionService: {
    resumeActiveSession: jest.fn().mockResolvedValue(null),
    startWorkoutSession: jest.fn().mockRejectedValue(new Error("No session in smoke test")),
    completeSession: jest.fn(),
    discardSession: jest.fn()
  }
}));

jest.mock("@/features/sessions/setLogService", () => ({
  setLogService: {
    logSet: jest.fn()
  }
}));

jest.mock("@/features/progress/progressService", () => ({
  progressService: {
    getExerciseProgress: jest.fn().mockResolvedValue({
      exercise: null,
      historySets: [],
      sessions: [],
      volumePoints: [],
      weightPoints: []
    })
  }
}));

jest.mock("@/features/progress/historyService", () => ({
  historyService: {
    listCompletedSessions: jest.fn().mockResolvedValue([]),
    listCompletedSessionsInRange: jest.fn().mockResolvedValue([])
  }
}));

describe("scaffold routes", () => {
  it("renders the home placeholder", async () => {
    const view = await render(<HomeScreen />);

    expect(await view.findByText("Workout trend")).toBeOnTheScreen();
  });

  it("renders the profile setup form", async () => {
    const view = await render(<ProfileSetupScreen />);

    expect(view.getByText("Create your profile")).toBeOnTheScreen();
    expect(await view.findByText("Update profile")).toBeOnTheScreen();
  });

  it("renders route placeholders for the main scaffold", async () => {
    const screens: [React.ReactElement, string][] = [
      [<ExerciseLibraryScreen key="exercises" />, "Exercise library"],
      [<ExerciseDetailScreen key="exercise-detail" />, "Exercise"],
      [<WorkoutsScreen key="workouts" />, "Workouts"],
      [<NewWorkoutScreen key="new-workout" />, "Create workout"],
      [<WorkoutDetailScreen key="workout-detail" />, "Workout"],
      [<ActiveSessionScreen key="session" />, "Log workout"],
      [<ProgressScreen key="progress" />, "Exercise progress"],
      [<HistoryScreen key="history" />, "Workout history"]
    ];

    for (const [route, title] of screens) {
      const view = await render(route);
      expect(view.getAllByText(title).length).toBeGreaterThan(0);
      await view.unmount();
    }
  });
});
