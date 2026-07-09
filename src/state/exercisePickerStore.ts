import { create } from "zustand";

type ExercisePickerStore = {
  excludedExerciseIds: string[];
  pickedExerciseId: string | null;
  open: (excludedExerciseIds: string[]) => void;
  pick: (exerciseId: string) => void;
  consumePicked: () => string | null;
  reset: () => void;
};

export const useExercisePickerStore = create<ExercisePickerStore>((set, get) => ({
  excludedExerciseIds: [],
  pickedExerciseId: null,

  open: (excludedExerciseIds) => set({ excludedExerciseIds, pickedExerciseId: null }),

  pick: (exerciseId) => set({ pickedExerciseId: exerciseId }),

  consumePicked: () => {
    const { pickedExerciseId } = get();

    if (pickedExerciseId) {
      set({ pickedExerciseId: null });
    }

    return pickedExerciseId;
  },

  reset: () => set({ excludedExerciseIds: [], pickedExerciseId: null })
}));
