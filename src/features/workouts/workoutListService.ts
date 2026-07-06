import type { DatabaseAdapter } from "@/db/client";
import { createWorkoutRepository } from "@/db/repositories/workoutRepository";
import type { WorkoutWithExercises } from "@/models/workout";

export type WorkoutListRepository = ReturnType<typeof createWorkoutRepository>;

export type WorkoutListData = {
  sampleWorkouts: WorkoutWithExercises[];
  customWorkouts: WorkoutWithExercises[];
};

export type WorkoutListService = {
  listWorkouts(): Promise<WorkoutListData>;
};

export function createWorkoutListService(repository: WorkoutListRepository): WorkoutListService {
  return {
    async listWorkouts() {
      const workouts = await repository.listWorkouts();
      const workoutsWithExercises = await Promise.all(
        workouts.map((workout) => repository.getWorkoutWithExercises(workout.id))
      );
      const loadedWorkouts = workoutsWithExercises.filter(
        (workout): workout is WorkoutWithExercises => workout !== null
      );

      return {
        sampleWorkouts: loadedWorkouts.filter((workout) => workout.isTemplate),
        customWorkouts: loadedWorkouts.filter((workout) => !workout.isTemplate)
      };
    }
  };
}

export function createWorkoutListServiceForDatabase(database: DatabaseAdapter): WorkoutListService {
  return createWorkoutListService(createWorkoutRepository(database));
}

async function createRuntimeWorkoutListService(): Promise<WorkoutListService> {
  const [
    { getDatabaseClient },
    { runMigrations },
    { loadSeedData }
  ] = await Promise.all([
    import("@/db/client"),
    import("@/db/migrate"),
    import("@/db/seed/loadSeedData")
  ]);
  const { adapter } = await getDatabaseClient();

  await runMigrations(adapter);
  await loadSeedData(adapter);

  return createWorkoutListServiceForDatabase(adapter);
}

export const workoutListService: WorkoutListService = {
  async listWorkouts() {
    return (await createRuntimeWorkoutListService()).listWorkouts();
  }
};
