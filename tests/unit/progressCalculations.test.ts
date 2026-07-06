import {
  calculateVolumeBySession,
  calculateWeightTrendPoints,
  groupHistorySetsBySession
} from "@/features/progress/progressCalculations";
import type { ExerciseHistorySet } from "@/models/session";

const historySets: ExerciseHistorySet[] = [
  {
    sessionId: "session-1",
    workoutNameSnapshot: "Full Body A",
    completedAt: "2026-07-06T10:00:00.000Z",
    setNumber: 1,
    reps: 10,
    weight: 20,
    effortRpe: 7,
    exerciseNameSnapshot: "Bodyweight Squat"
  },
  {
    sessionId: "session-1",
    workoutNameSnapshot: "Full Body A",
    completedAt: "2026-07-06T10:03:00.000Z",
    setNumber: 2,
    reps: 8,
    weight: 22.5,
    effortRpe: 8,
    exerciseNameSnapshot: "Bodyweight Squat"
  },
  {
    sessionId: "session-2",
    workoutNameSnapshot: "Full Body B",
    completedAt: "2026-07-08T10:00:00.000Z",
    setNumber: 1,
    reps: 12,
    weight: 20,
    effortRpe: 7,
    exerciseNameSnapshot: "Bodyweight Squat"
  }
];

describe("progress calculations", () => {
  it("groups history sets by completed session", () => {
    expect(groupHistorySetsBySession(historySets)).toEqual([
      {
        sessionId: "session-1",
        workoutNameSnapshot: "Full Body A",
        completedAt: "2026-07-06T10:03:00.000Z",
        setCount: 2,
        totalVolume: 380,
        sets: [historySets[0], historySets[1]]
      },
      {
        sessionId: "session-2",
        workoutNameSnapshot: "Full Body B",
        completedAt: "2026-07-08T10:00:00.000Z",
        setCount: 1,
        totalVolume: 240,
        sets: [historySets[2]]
      }
    ]);
  });

  it("calculates total volume by session", () => {
    expect(calculateVolumeBySession(historySets)).toEqual([
      {
        sessionId: "session-1",
        completedAt: "2026-07-06T10:03:00.000Z",
        volume: 380
      },
      {
        sessionId: "session-2",
        completedAt: "2026-07-08T10:00:00.000Z",
        volume: 240
      }
    ]);
  });

  it("keeps weight trend points without calculating PR metrics", () => {
    const points = calculateWeightTrendPoints(historySets);

    expect(points).toEqual([
      { sessionId: "session-1", completedAt: "2026-07-06T10:00:00.000Z", weight: 20 },
      { sessionId: "session-1", completedAt: "2026-07-06T10:03:00.000Z", weight: 22.5 },
      { sessionId: "session-2", completedAt: "2026-07-08T10:00:00.000Z", weight: 20 }
    ]);
    expect(points).not.toHaveProperty("highestWeight");
    expect(points).not.toHaveProperty("oneRepMax");
  });
});
