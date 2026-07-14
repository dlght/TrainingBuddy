import { createPersonalRecordRepository } from "@/features/sessions/personalRecordRepository";
import { createSessionService } from "@/features/sessions/sessionService";
import { createSetLogService } from "@/features/sessions/setLogService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("personal record tracking (completeSession)", () => {
  it("records a PR when a completed session's set beats every prior best", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);
    const personalRecordRepository = createPersonalRecordRepository(client);

    const activeSession = await sessionService.startWorkoutSession("workout-a");
    const squat = activeSession.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");

    if (!squat) {
      throw new Error("Seed workout did not contain Bodyweight Squat.");
    }

    await setLogService.logSet({ sessionId: activeSession.session.id, workoutExerciseId: squat.id, reps: 5, weight: 60 });
    await sessionService.completeSession(activeSession.session.id);

    const records = await personalRecordRepository.listPersonalRecords(TEST_USER_ID);

    expect(records).toEqual([{ exerciseId: "bodyweight-squat", weight: 60 }]);
  });

  it("does not record a new PR when a later session's best set does not beat the prior best", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);
    const personalRecordRepository = createPersonalRecordRepository(client);

    const first = await sessionService.startWorkoutSession("workout-a");
    const squat1 = first.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");
    if (!squat1) throw new Error("Missing exercise");
    await setLogService.logSet({ sessionId: first.session.id, workoutExerciseId: squat1.id, reps: 5, weight: 60 });
    await sessionService.completeSession(first.session.id);

    const second = await sessionService.startWorkoutSession("workout-a");
    const squat2 = second.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");
    if (!squat2) throw new Error("Missing exercise");
    await setLogService.logSet({ sessionId: second.session.id, workoutExerciseId: squat2.id, reps: 5, weight: 55 });
    await sessionService.completeSession(second.session.id);

    const records = await personalRecordRepository.listPersonalRecords(TEST_USER_ID);

    expect(records).toEqual([{ exerciseId: "bodyweight-squat", weight: 60 }]);
  });

  it("never records a PR for a discarded session, even if its best set would have been one", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const sessionService = createSessionService(client);
    const setLogService = createSetLogService(client);
    const personalRecordRepository = createPersonalRecordRepository(client);

    const activeSession = await sessionService.startWorkoutSession("workout-a");
    const squat = activeSession.exercises.find((exercise) => exercise.exerciseId === "bodyweight-squat");
    if (!squat) throw new Error("Missing exercise");

    await setLogService.logSet({ sessionId: activeSession.session.id, workoutExerciseId: squat.id, reps: 5, weight: 100 });
    await sessionService.discardSession(activeSession.session.id);

    const records = await personalRecordRepository.listPersonalRecords(TEST_USER_ID);

    expect(records).toEqual([]);
  });
});
