/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCreateCustomWorkout = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    __esModule: true,
    useRouter: () => ({ replace: mockReplace, push: mockPush }),
    useLocalSearchParams: () => ({}),
    // No dependency array: re-runs after every render, standing in for a real
    // focus event firing each time this screen is navigated back to (e.g.
    // after picking an exercise on the add-exercise screen).
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => {
        effect();
      });
    }
  };
});

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

import { useExercisePickerStore } from "@/state/exercisePickerStore";

const NewWorkoutScreen = require("../../app/workouts/new").default;

/** Simulates picking an exercise on the add-exercise screen and navigating back to it. */
async function pickExercise(exerciseId: string) {
  await act(async () => {
    useExercisePickerStore.getState().pick(exerciseId);
  });
}

describe("WorkoutBuilder screen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
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
    useExercisePickerStore.getState().reset();
  });

  it("opens the exercise picker with the currently selected exercises excluded", async () => {
    const view = await render(<NewWorkoutScreen />);

    await fireEvent.press(await view.findByLabelText("Add exercises"));

    expect(mockPush).toHaveBeenCalledWith("/workouts/add-exercise");
    expect(useExercisePickerStore.getState().excludedExerciseIds).toEqual([]);
  });

  it("creates a three-exercise custom workout via the exercise picker", async () => {
    const view = await render(<NewWorkoutScreen />);
    await view.findByLabelText("Add exercises");

    await fireEvent.changeText(view.getByLabelText("Workout name"), "Starter Strength");

    await fireEvent.press(view.getByLabelText("Add exercises"));
    await pickExercise("bodyweight-squat");
    await view.rerender(<NewWorkoutScreen />);
    await view.findByText("Bodyweight Squat");

    await fireEvent.press(view.getByLabelText("Add exercises"));
    expect(useExercisePickerStore.getState().excludedExerciseIds).toEqual(["bodyweight-squat"]);
    await pickExercise("incline-push-up");
    await view.rerender(<NewWorkoutScreen />);
    await view.findByText("Incline Push-Up");

    await fireEvent.press(view.getByLabelText("Add exercises"));
    await pickExercise("one-arm-dumbbell-row");
    await view.rerender(<NewWorkoutScreen />);
    await view.findByText("One-Arm Dumbbell Row");

    // Weight is not collected for bodyweight exercises, but is for equipment-based ones.
    expect(view.queryByLabelText("Weight for Bodyweight Squat set 1")).toBeNull();
    expect(view.getByLabelText("Weight for Incline Push-Up set 1")).toBeOnTheScreen();
    expect(view.getByLabelText("Weight for One-Arm Dumbbell Row set 1")).toBeOnTheScreen();

    await fireEvent.press(view.getByText("Save workout"));

    await waitFor(() => expect(mockCreateCustomWorkout).toHaveBeenCalledTimes(1));
    expect(mockCreateCustomWorkout).toHaveBeenCalledWith({
      name: "Starter Strength",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetRestSeconds: "60",
          setPlans: [{ reps: "10", weight: null }]
        },
        {
          exerciseId: "incline-push-up",
          targetRestSeconds: "60",
          setPlans: [{ reps: "10", weight: "" }]
        },
        {
          exerciseId: "one-arm-dumbbell-row",
          targetRestSeconds: "60",
          setPlans: [{ reps: "10", weight: "" }]
        }
      ]
    });
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("lets each exercise's rest time be edited independently", async () => {
    const view = await render(<NewWorkoutScreen />);
    await view.findByLabelText("Add exercises");

    await fireEvent.changeText(view.getByLabelText("Workout name"), "Starter Strength");

    await fireEvent.press(view.getByLabelText("Add exercises"));
    await pickExercise("bodyweight-squat");
    await view.rerender(<NewWorkoutScreen />);
    await view.findByText("Bodyweight Squat");

    await fireEvent.press(view.getByLabelText("Add exercises"));
    await pickExercise("incline-push-up");
    await view.rerender(<NewWorkoutScreen />);
    await view.findByText("Incline Push-Up");

    await fireEvent.changeText(view.getByLabelText("Rest seconds for Bodyweight Squat"), "30");
    await fireEvent.changeText(view.getByLabelText("Rest seconds for Incline Push-Up"), "120");

    await fireEvent.press(view.getByText("Save workout"));

    await waitFor(() => expect(mockCreateCustomWorkout).toHaveBeenCalledTimes(1));
    expect(mockCreateCustomWorkout).toHaveBeenCalledWith({
      name: "Starter Strength",
      exercises: [
        {
          exerciseId: "bodyweight-squat",
          targetRestSeconds: "30",
          setPlans: [{ reps: "10", weight: null }]
        },
        {
          exerciseId: "incline-push-up",
          targetRestSeconds: "120",
          setPlans: [{ reps: "10", weight: "" }]
        }
      ]
    });
  });
});
