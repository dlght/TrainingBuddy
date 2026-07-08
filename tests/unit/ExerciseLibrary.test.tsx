/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";

import ExerciseLibraryScreen from "../../app/exercises";

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    __esModule: true,
    Link: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children)
  };
});

jest.mock("@/features/exercises/exerciseLibraryService", () => {
  const { starterSeedData } = require("@/db/seed/sampleWorkouts");
  const {
    getFirstAvailableMuscleGroup,
    groupExercisesByMuscleGroup,
    sortMuscleGroups
  } = require("@/features/exercises/exerciseSelectors");

  const groupedExercises = groupExercisesByMuscleGroup(
    starterSeedData.exercises,
    starterSeedData.muscleGroups
  );

  return {
    exerciseLibraryService: {
      getLibraryData: jest.fn().mockResolvedValue({
        muscleGroups: sortMuscleGroups(starterSeedData.muscleGroups),
        exercises: starterSeedData.exercises,
        groupedExercises,
        defaultMuscleGroupId: getFirstAvailableMuscleGroup(groupedExercises)
      }),
      listExercisesByMuscleGroup: jest.fn(),
      getExerciseById: jest.fn()
    }
  };
});

describe("ExerciseLibraryScreen", () => {
  it("browses seeded exercises by muscle group", async () => {
    const view = await render(<ExerciseLibraryScreen />);

    expect(await view.findByText("Barbell Bench Press")).toBeOnTheScreen();
    expect(view.queryByText("Bodyweight Squat")).toBeNull();

    await fireEvent.press(view.getByText("Legs"));

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();
    expect(view.getAllByText("Warmup").length).toBeGreaterThan(0);
  });
});
