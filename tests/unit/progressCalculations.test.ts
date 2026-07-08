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
    exerciseNameSnapshot: "Bodyweight Squat"
  },
  {
    sessionId: "session-1",
    workoutNameSnapshot: "Full Body A",
    completedAt: "2026-07-06T10:03:00.000Z",
    setNumber: 2,
    reps: 8,
    weight: 22.5,
    exerciseNameSnapshot: "Bodyweight Squat"
  },
  {
    sessionId: "session-2",
    workoutNameSnapshot: "Full Body B",
    completedAt: "2026-07-08T10:00:00.000Z",
    setNumber: 1,
    reps: 12,
    weight: 20,
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

  it("handles bodyweight sets with no weight value", () => {
    const bodyweightSets: ExerciseHistorySet[] = [
      {
        sessionId: "session-3",
        workoutNameSnapshot: "Full Body C",
        completedAt: "2026-07-09T10:00:00.000Z",
        setNumber: 1,
        reps: 15,
        weight: null,
        exerciseNameSnapshot: "Bodyweight Squat"
      },
      {
        sessionId: "session-3",
        workoutNameSnapshot: "Full Body C",
        completedAt: "2026-07-09T10:05:00.000Z",
        setNumber: 2,
        reps: 10,
        weight: 20,
        exerciseNameSnapshot: "Bodyweight Squat"
      }
    ];

    const sessions = groupHistorySetsBySession(bodyweightSets);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].setCount).toBe(2);
    expect(sessions[0].totalVolume).toBe(200);

    const volumePoints = calculateVolumeBySession(bodyweightSets);
    expect(volumePoints).toEqual([
      { sessionId: "session-3", completedAt: "2026-07-09T10:05:00.000Z", volume: 200 }
    ]);

    const weightPoints = calculateWeightTrendPoints(bodyweightSets);
    expect(weightPoints).toEqual([
      { sessionId: "session-3", completedAt: "2026-07-09T10:05:00.000Z", weight: 20 }
    ]);
  });

  it("reports zero volume for an all-bodyweight session rather than throwing", () => {
    const allBodyweight: ExerciseHistorySet[] = [
      {
        sessionId: "session-4",
        workoutNameSnapshot: "Full Body D",
        completedAt: "2026-07-10T10:00:00.000Z",
        setNumber: 1,
        reps: 20,
        weight: null,
        exerciseNameSnapshot: "Bodyweight Squat"
      }
    ];

    expect(() => groupHistorySetsBySession(allBodyweight)).not.toThrow();
    expect(calculateVolumeBySession(allBodyweight)).toEqual([
      { sessionId: "session-4", completedAt: "2026-07-10T10:00:00.000Z", volume: 0 }
    ]);
    expect(calculateWeightTrendPoints(allBodyweight)).toEqual([]);
  });
});
