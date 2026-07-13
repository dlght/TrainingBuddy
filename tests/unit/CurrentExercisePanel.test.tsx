import { render } from "@testing-library/react-native";

import { CurrentExercisePanel } from "@/features/sessions/CurrentExercisePanel";
import type { ActiveSessionExercise } from "@/features/sessions/sessionService";
import type { SetLog } from "@/models/session";

function buildExercise(overrides: Partial<ActiveSessionExercise> = {}): ActiveSessionExercise {
  return {
    id: "we-1",
    workoutId: "workout-1",
    exerciseId: "exercise-1",
    orderIndex: 0,
    targetSets: 3,
    targetRepRangeLow: 8,
    targetRepRangeHigh: 12,
    targetRestSeconds: 60,
    targetWeight: null,
    supersetGroupId: null,
    setPlans: [],
    exerciseName: "Push-up",
    loggedSetCount: 1,
    isBodyweight: true,
    ...overrides
  };
}

function buildSetLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    id: "set-1",
    sessionId: "session-1",
    workoutExerciseId: "we-1",
    setNumber: 1,
    reps: 8,
    weight: null,
    completedAt: "2026-01-01T00:00:00.000Z",
    exerciseNameSnapshot: "Push-up",
    targetRepsSnapshot: "8-12",
    targetRestSecondsSnapshot: 60,
    ...overrides
  };
}

describe("CurrentExercisePanel", () => {
  it("shows just the reps for a logged bodyweight set, with no weight text", async () => {
    const view = await render(
      <CurrentExercisePanel
        exercise={buildExercise()}
        exerciseIndex={0}
        exerciseCount={1}
        setLogs={[buildSetLog({ weight: null })]}
        onPrevious={jest.fn()}
        onNext={jest.fn()}
      />
    );

    expect(view.getByText("Set 1: 8 reps")).toBeOnTheScreen();
  });

  it("shows reps and weight for a logged weighted set", async () => {
    const view = await render(
      <CurrentExercisePanel
        exercise={buildExercise({ isBodyweight: false })}
        exerciseIndex={0}
        exerciseCount={1}
        setLogs={[buildSetLog({ weight: 42.5 })]}
        onPrevious={jest.fn()}
        onNext={jest.fn()}
      />
    );

    expect(view.getByText("Set 1: 8 reps, 42.5 weight")).toBeOnTheScreen();
  });
});
