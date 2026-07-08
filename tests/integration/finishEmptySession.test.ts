import { createSessionServiceForDatabase } from "@/features/sessions/sessionService";
import { createSetLogServiceForDatabase } from "@/features/sessions/setLogService";
import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";

import { TestDatabase } from "../helpers/testDatabase";

async function prepareDatabase() {
  const database = new TestDatabase();

  await loadSeedData(database);
  await createProfileServiceForDatabase(database).saveProfileInput({
    id: "local-user",
    name: "Alex",
    bodyweight: 75,
    height: null,
    weightUnit: "kg",
    experienceLevel: "new",
    goal: "Build consistency"
  });

  return database;
}

describe("finishing a session with no logged sets", () => {
  it("completes a session that has zero logged sets", async () => {
    const database = await prepareDatabase();
    const [template] = await createWorkoutRepository(database).listTemplateWorkouts();
    const sessionService = createSessionServiceForDatabase(database);
    const activeSession = await sessionService.startWorkoutSession(template.id, "local-user");

    const completed = await sessionService.completeSession(activeSession.session.id);

    expect(completed.session.status).toBe("completed");
    expect(completed.session.endedAt).not.toBeNull();
    expect(completed.setLogs).toHaveLength(0);
  });

  it("completes a session with only some exercises logged", async () => {
    const database = await prepareDatabase();
    const [template] = await createWorkoutRepository(database).listTemplateWorkouts();
    const sessionService = createSessionServiceForDatabase(database);
    const setLogService = createSetLogServiceForDatabase(database);
    const activeSession = await sessionService.startWorkoutSession(template.id, "local-user");
    const firstExercise = activeSession.exercises[0];

    await setLogService.logSet({
      sessionId: activeSession.session.id,
      workoutExerciseId: firstExercise.id,
      reps: "10",
      weight: "25"
    });

    const completed = await sessionService.completeSession(activeSession.session.id);

    expect(completed.session.status).toBe("completed");
    expect(completed.setLogs).toHaveLength(1);
  });
});
