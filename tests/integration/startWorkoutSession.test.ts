import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { createSessionServiceForDatabase } from "@/features/sessions/sessionService";
import { createWorkoutBuilderServiceForDatabase } from "@/features/workouts/workoutBuilderService";
import { loadSeedData } from "@/db/seed/loadSeedData";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";

import { TestDatabase } from "../helpers/testDatabase";

async function saveProfile(database: TestDatabase) {
  await createProfileServiceForDatabase(database).saveProfileInput({
    id: "local-user",
    name: "Alex",
    bodyweight: 75,
    height: null,
    weightUnit: "kg",
    experienceLevel: "new",
    goal: "Build consistency"
  });
}

describe("starting workout sessions", () => {
  it("starts sessions from sample and custom workouts", async () => {
    const database = new TestDatabase();

    await loadSeedData(database);
    await saveProfile(database);

    const sessionService = createSessionServiceForDatabase(database);
    const workoutRepository = createWorkoutRepository(database);
    const [template] = await workoutRepository.listTemplateWorkouts();

    const sampleSession = await sessionService.startWorkoutSession(template.id, "local-user");

    expect(sampleSession.session).toMatchObject({
      workoutId: template.id,
      userId: "local-user",
      status: "active",
      workoutNameSnapshot: template.name
    });
    expect(sampleSession.exercises.length).toBeGreaterThan(0);

    await sessionService.discardSession(sampleSession.session.id);

    const customWorkout = await createWorkoutBuilderServiceForDatabase(database).createCustomWorkout(
      {
        name: "Custom A",
        exercises: [
          {
            exerciseId: "bodyweight-squat",
            targetRestSeconds: 60,
            setPlans: [{ reps: 10, weight: null }]
          }
        ]
      },
      "local-user"
    );
    const customSession = await sessionService.startWorkoutSession(customWorkout.id, "local-user");

    expect(customSession.session.workoutId).toBe(customWorkout.id);
    expect(customSession.exercises.map((exercise) => exercise.exerciseName)).toEqual([
      "Bodyweight Squat"
    ]);
  });
});
