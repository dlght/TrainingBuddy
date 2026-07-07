import { create } from "zustand";

import type { Exercise } from "@/models/exercise";

type SwipeDeckStore = {
  // Available exercises to swipe through
  availableExercises: Exercise[];
  // Exercises added to the workout
  addedExerciseIds: Set<string>;
  // Current exercise index in the deck
  currentIndex: number;
  // Program Type filter (if any)
  programTypeFilter: string | null;
  // Whether to show all exercises (ignore filter)
  showAll: boolean;
  // Whether alternatives modal is open
  alternativesOpen: boolean;
  // Current exercise for alternatives
  alternativesExercise: Exercise | null;

  // Actions
  setAvailableExercises: (exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  nextCard: () => void;
  previousCard: () => void;
  setCurrentIndex: (index: number) => void;
  setProgramTypeFilter: (programType: string | null) => void;
  setShowAll: (showAll: boolean) => void;
  openAlternatives: (exercise: Exercise) => void;
  closeAlternatives: () => void;
  reset: () => void;
};

export const useSwipeDeckStore = create<SwipeDeckStore>((set) => ({
  availableExercises: [],
  addedExerciseIds: new Set(),
  currentIndex: 0,
  programTypeFilter: null,
  showAll: false,
  alternativesOpen: false,
  alternativesExercise: null,

  setAvailableExercises: (exercises) =>
    set({
      availableExercises: exercises || [],
      currentIndex: 0
    }),

  addExercise: (exercise) =>
    set((state) => {
      if (!exercise?.id) return state;
      return {
        addedExerciseIds: new Set([...state.addedExerciseIds, exercise.id])
      };
    }),

  removeExercise: (exerciseId) =>
    set((state) => {
      if (!exerciseId) return state;
      const newSet = new Set(state.addedExerciseIds);
      newSet.delete(exerciseId);
      return { addedExerciseIds: newSet };
    }),

  nextCard: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.availableExercises.length - 1)
    })),

  previousCard: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0)
    })),

  setCurrentIndex: (index) =>
    set((state) => ({
      currentIndex: Math.max(0, Math.min(index, state.availableExercises.length - 1))
    })),

  setProgramTypeFilter: (programType) =>
    set({
      programTypeFilter: programType,
      showAll: false,
      currentIndex: 0
    }),

  setShowAll: (showAll) =>
    set({
      showAll,
      currentIndex: 0
    }),

  openAlternatives: (exercise) =>
    set({
      alternativesOpen: true,
      alternativesExercise: exercise || null
    }),

  closeAlternatives: () =>
    set({
      alternativesOpen: false,
      alternativesExercise: null
    }),

  reset: () =>
    set({
      availableExercises: [],
      addedExerciseIds: new Set(),
      currentIndex: 0,
      programTypeFilter: null,
      showAll: false,
      alternativesOpen: false,
      alternativesExercise: null
    })
}));
