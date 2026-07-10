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
  const {
    getFirstAvailableMuscleGroup,
    groupExercisesByMuscleGroup,
    sortMuscleGroups
  } = require("@/features/exercises/exerciseSelectors");

  function buildExercise(overrides: Record<string, unknown> = {}) {
    return {
      id: "fixture-exercise",
      name: "Fixture Exercise",
      muscleGroupId: "chest",
      equipment: "bodyweight",
      imageUrl: "",
      instructions: "Move with control.",
      isWarmup: false,
      videoUrl: null,
      source: "wger",
      sourceId: "seed-fixture-exercise",
      licenseAuthor: "wger exercise contributors",
      licenseUrl: "https://wger.de/",
      ...overrides
    };
  }

  const fixtureMuscleGroups = [
    { id: "chest", name: "chest" },
    { id: "legs", name: "legs" }
  ];

  const fixtureExercises = [
    buildExercise({ id: "barbell-bench-press", name: "Barbell Bench Press", muscleGroupId: "chest" }),
    buildExercise({
      id: "bodyweight-squat",
      name: "Bodyweight Squat",
      muscleGroupId: "legs",
      isWarmup: true
    })
  ];

  const groupedExercises = groupExercisesByMuscleGroup(fixtureExercises, fixtureMuscleGroups);

  return {
    exerciseLibraryService: {
      getLibraryData: jest.fn().mockResolvedValue({
        muscleGroups: sortMuscleGroups(fixtureMuscleGroups),
        exercises: fixtureExercises,
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
