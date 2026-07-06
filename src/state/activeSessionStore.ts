import { create } from "zustand";

import { DEFAULT_REST_SECONDS } from "@/features/sessions/useRestTimer";

type ActiveSessionStore = {
  sessionId: string | null;
  currentExerciseIndex: number;
  restDurationSeconds: number;
  resetForSession: (sessionId: string, initialExerciseIndex?: number) => void;
  setCurrentExerciseIndex: (index: number) => void;
  setRestDurationSeconds: (seconds: number) => void;
  reset: () => void;
};

export const useActiveSessionStore = create<ActiveSessionStore>((set) => ({
  sessionId: null,
  currentExerciseIndex: 0,
  restDurationSeconds: DEFAULT_REST_SECONDS,
  resetForSession: (sessionId, initialExerciseIndex = 0) =>
    set((state) => ({
      sessionId,
      currentExerciseIndex: state.sessionId === sessionId ? state.currentExerciseIndex : initialExerciseIndex,
      restDurationSeconds: state.restDurationSeconds
    })),
  setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: Math.max(0, index) }),
  setRestDurationSeconds: (seconds) => set({ restDurationSeconds: Math.max(0, seconds) }),
  reset: () =>
    set({
      sessionId: null,
      currentExerciseIndex: 0,
      restDurationSeconds: DEFAULT_REST_SECONDS
    })
}));
