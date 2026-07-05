import { render, screen } from "@testing-library/react-native";

import ExerciseLibraryScreen from "../../app/exercises";
import ExerciseDetailScreen from "../../app/exercises/[exerciseId]";
import HomeScreen from "../../app";
import ProgressScreen from "../../app/progress/[exerciseId]";
import ProfileSetupScreen from "../../app/profile/setup";
import ActiveSessionScreen from "../../app/workouts/[workoutId]/session";
import WorkoutDetailScreen from "../../app/workouts/[workoutId]";
import NewWorkoutScreen from "../../app/workouts/new";
import WorkoutsScreen from "../../app/workouts";

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    Link: ({ children }: { children: React.ReactNode }) => React.createElement("Text", null, children),
    useLocalSearchParams: () => ({ exerciseId: "placeholder", workoutId: "placeholder" })
  };
});

describe("scaffold routes", () => {
  it("renders the home placeholder", async () => {
    await render(<HomeScreen />);

    expect(screen.getByText("TrainingBuddy")).toBeOnTheScreen();
  });

  it("renders the profile setup placeholder", async () => {
    await render(<ProfileSetupScreen />);

    expect(screen.getByText("Create your profile")).toBeOnTheScreen();
  });

  it("renders route placeholders for the main scaffold", async () => {
    const screens: Array<[React.ReactElement, string]> = [
      [<ExerciseLibraryScreen key="exercises" />, "Exercise library"],
      [<ExerciseDetailScreen key="exercise-detail" />, "Exercise"],
      [<WorkoutsScreen key="workouts" />, "Workouts"],
      [<NewWorkoutScreen key="new-workout" />, "Create workout"],
      [<WorkoutDetailScreen key="workout-detail" />, "Workout"],
      [<ActiveSessionScreen key="session" />, "Log workout"],
      [<ProgressScreen key="progress" />, "Exercise progress"]
    ];

    for (const [route, title] of screens) {
      const view = await render(route);
      expect(screen.getByText(title)).toBeOnTheScreen();
      view.unmount();
    }
  });
});
