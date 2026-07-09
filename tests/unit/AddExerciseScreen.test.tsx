/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ back: mockBack })
}));

jest.mock("@/features/exercises/exerciseLibraryService", () => ({
  exerciseLibraryService: {
    getLibraryData: jest.fn().mockResolvedValue({
      muscleGroups: [],
      groupedExercises: [],
      defaultMuscleGroupId: null,
      exercises: [
        { id: "squat", name: "Barbell Squat", muscleGroupId: "legs" },
        { id: "bench", name: "Bench Press", muscleGroupId: "chest" },
        { id: "row", name: "Bent-Over Row", muscleGroupId: "back" }
      ]
    })
  }
}));

import { exerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import { useExercisePickerStore } from "@/state/exercisePickerStore";

const AddExerciseScreen = require("../../app/workouts/add-exercise").default;

const LARGE_EXERCISE_POOL = Array.from({ length: 15 }, (_, i) => ({
  id: `exercise-${i}`,
  name: `Exercise Number ${i}`,
  muscleGroupId: "legs"
}));

describe("AddExerciseScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    useExercisePickerStore.getState().reset();
  });

  it("filters the exercise list by search text", async () => {
    const view = await render(<AddExerciseScreen />);

    expect(await view.findByText("Barbell Squat")).toBeOnTheScreen();
    expect(view.getByText("Bench Press")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Search exercises"), "bench");

    expect(view.getByText("Bench Press")).toBeOnTheScreen();
    expect(view.queryByText("Barbell Squat")).toBeNull();
  });

  it("excludes exercises already on the workout", async () => {
    useExercisePickerStore.getState().open(["squat"]);

    const view = await render(<AddExerciseScreen />);

    expect(await view.findByText("Bench Press")).toBeOnTheScreen();
    expect(view.queryByText("Barbell Squat")).toBeNull();
  });

  it("shows an honest empty state when nothing matches", async () => {
    const view = await render(<AddExerciseScreen />);
    await view.findByText("Barbell Squat");

    await fireEvent.changeText(view.getByLabelText("Search exercises"), "nonexistent exercise");

    expect(await view.findByText("No matching exercises")).toBeOnTheScreen();
  });

  it("stores the picked exercise id and navigates back on tap", async () => {
    const view = await render(<AddExerciseScreen />);

    await fireEvent.press(await view.findByLabelText("Add Bench Press"));

    expect(useExercisePickerStore.getState().pickedExerciseId).toBe("bench");
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows only 10 random exercises by default, but every match once searching", async () => {
    (exerciseLibraryService.getLibraryData as jest.Mock).mockResolvedValueOnce({
      muscleGroups: [],
      groupedExercises: [],
      defaultMuscleGroupId: null,
      exercises: LARGE_EXERCISE_POOL
    });

    const view = await render(<AddExerciseScreen />);

    await view.findByText(/Showing 10 random exercises/);
    expect(view.getAllByLabelText(/^Add Exercise Number/).length).toBe(10);

    await fireEvent.changeText(view.getByLabelText("Search exercises"), "Exercise Number");

    expect(view.queryByText(/Showing 10 random exercises/)).toBeNull();
    expect(view.getAllByLabelText(/^Add Exercise Number/).length).toBe(15);
  });
});
