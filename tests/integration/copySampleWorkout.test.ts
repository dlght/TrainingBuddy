import { createWorkoutBuilderService } from "@/features/workouts/workoutBuilderService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";
import { baseSeed, TEST_USER_ID } from "../helpers/seedFixture";

describe("copying sample workouts", () => {
  it("copies a protected sample before custom editing", async () => {
    const client = createFakeSupabaseClient(baseSeed(), TEST_USER_ID);
    const service = createWorkoutBuilderService(client);

    await expect(
      service.updateCustomWorkout("workout-a", {
        name: "Edited Sample",
        exercises: [
          {
            exerciseId: "bodyweight-squat",
            targetRestSeconds: 60,
            setPlans: [
              { reps: 8, weight: null },
              { reps: 12, weight: null }
            ]
          }
        ]
      })
    ).rejects.toThrow("Sample workout templates are protected");

    const original = await service.getWorkout("workout-a");
    const copied = await service.copyTemplateWorkout("workout-a");

    expect(copied).toMatchObject({ isTemplate: false, userId: TEST_USER_ID, sourceTemplateId: "workout-a" });
    expect(copied.exercises).toHaveLength(original?.exercises.length ?? 0);
    expect(original?.isTemplate).toBe(true);

    const updatedCopy = await service.updateCustomWorkout(copied.id, {
      name: "Full Body A Custom",
      exercises: copied.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        targetRestSeconds: exercise.targetRestSeconds,
        supersetGroupId: exercise.supersetGroupId,
        setPlans: exercise.setPlans.map((plan) => ({ reps: plan.reps, weight: plan.weight }))
      }))
    });

    expect(updatedCopy.name).toBe("Full Body A Custom");
    expect((await service.getWorkout("workout-a"))?.name).toBe("Full Body A");
  });
});
