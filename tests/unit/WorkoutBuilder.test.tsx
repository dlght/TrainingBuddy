/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockCreateCustomWorkout = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({})
}));

jest.mock("@/features/exercises/exerciseLibraryService", () => ({
  exerciseLibraryService: {
    getLibraryData: jest.fn().mockResolvedValue({
      muscleGroups: [],
      groupedExercises: [],
      defaultMuscleGroupId: null,
      exercises: [
        {
          id: "bodyweight-squat",
          name: "Bodyweight Squat",
          muscleGroupId: "legs",
          equipment: "bodyweight",
          imageUrl: "assets/seed-exercises/placeholder.txt",
          instructions: "Squat with control.",
          isWarmup: true,
          videoUrl: null,
          source: "wger",
          sourceId: "seed-bodyweight-squat",
          licenseAuthor: null,
          licenseUrl: null
        },
        {
          id: "incline-push-up",
          name: "Incline Push-Up",
          muscleGroupId: "chest",
          equipment: "bench",
          imageUrl: "assets/seed-exercises/placeholder.txt",
          instructions: "Press from an incline.",
          isWarmup: false,
          videoUrl: null,
          source: "wger",
          sourceId: "seed-incline-push-up",
          licenseAuthor: null,
          licenseUrl: null
        },
        {
          id: "one-arm-dumbbell-row",
          name: "One-Arm Dumbbell Row",
          muscleGroupId: "back",
          equipment: "dumbbell",
          imageUrl: "assets/seed-exercises/placeholder.txt",
          instructions: "Row with control.",
          isWarmup: false,
          videoUrl: null,
          source: "wger",
          sourceId: "seed-one-arm-dumbbell-row",
          licenseAuthor: null,
          licenseUrl: null
        }
      ]
    })
  }
}));

jest.mock("@/features/workouts/workoutBuilderService", () => ({
  workoutBuilderService: {
    getWorkout: jest.fn(),
    createCustomWorkout: mockCreateCustomWorkout,
    updateCustomWorkout: jest.fn(),
    deleteCustomWorkout: jest.fn(),
    copyTemplateWorkout: jest.fn()
  }
}));

const NewWorkoutScreen = require("../../app/workouts/new").default;

describe("WorkoutBuilder screen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockCreateCustomWorkout.mockReset();
    mockCreateCustomWorkout.mockResolvedValue({
      id: "workout-created",
      name: "Starter Strength",
      userId: "local-user",
      createdAt: "2026-07-06T00:00:00.000Z",
      isTemplate: false,
      sourceTemplateId: null,
      exercises: []
    });
  });

  it("creates a three-exercise custom workout", async () => {
    const view = await render(<NewWorkoutScreen />);

    expect(await view.findByText("Bodyweight Squat")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Workout name"), "Starter Strength");
    await fireEvent.press(view.getByLabelText("Add exercise"));
    await fireEvent.press(view.getByLabelText("Add exercise"));
    await fireEvent.press(view.getByLabelText("Add exercise"));

    // Weight is not collected for bodyweight exercises, but is for equipment-based ones.
    expect(view.queryByLabelText("Default weight for Bodyweight Squat")).toBeNull();
    expect(view.getByLabelText("Default weight for Incline Push-Up")).toBeOnTheScreen();
    expect(view.getByLabelText("Default weight for One-Arm Dumbbell Row")).toBeOnTheScreen();

    await fireEvent.press(view.getByText("Save workout"));

    await waitFor(() => expect(mockCreateCustomWorkout).toHaveBeenCalledTimes(1));
    expect(mockCreateCustomWorkout).toHaveBeenCalledWith({
      name: "Starter Strength",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetSets: "2",
          targetRepRangeLow: "10",
          targetRepRangeHigh: "10",
          targetRestSeconds: "60",
          targetWeight: null,
          supersetGroupId: null
        },
        {
          exerciseId: "incline-push-up",
          targetSets: "2",
          targetRepRangeLow: "10",
          targetRepRangeHigh: "10",
          targetRestSeconds: "60",
          targetWeight: "",
          supersetGroupId: null
        },
        {
          exerciseId: "one-arm-dumbbell-row",
          targetSets: "2",
          targetRepRangeLow: "10",
          targetRepRangeHigh: "10",
          targetRestSeconds: "60",
          targetWeight: "",
          supersetGroupId: null
        }
      ]
    });
    expect(mockReplace).toHaveBeenCalledWith("/workouts/workout-created");
  });
});
