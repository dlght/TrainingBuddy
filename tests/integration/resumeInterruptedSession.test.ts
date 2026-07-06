import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { createSessionServiceForDatabase } from "@/features/sessions/sessionService";
import { createSetLogServiceForDatabase } from "@/features/sessions/setLogService";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createSessionRepository } from "@/db/repositories/sessionRepository";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";

import { TestDatabase } from "../helpers/testDatabase";

describe("interrupted session resume and discard", () => {
  it("resumes logged set data after recreating services and can discard the active session", async () => {
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

    const [template] = await createWorkoutRepository(database).listTemplateWorkouts();
    const firstSessionService = createSessionServiceForDatabase(database);
    const firstSetLogService = createSetLogServiceForDatabase(database);
    const started = await firstSessionService.startWorkoutSession(template.id, "local-user");

    await firstSetLogService.logSet({
      sessionId: started.session.id,
      workoutExerciseId: started.exercises[0].id,
      reps: 8,
      weight: 20,
    });


    const resumed = await createSessionServiceForDatabase(database).resumeActiveSession("local-user");

    expect(resumed?.session.id).toBe(started.session.id);
    expect(resumed?.setLogs).toHaveLength(1);

    await createSessionServiceForDatabase(database).discardSession(started.session.id);

    expect(await createSessionServiceForDatabase(database).resumeActiveSession("local-user")).toBeNull();
    expect((await createSessionRepository(database).getSessionById(started.session.id))?.status).toBe(
      "discarded"
    );
  });
});
