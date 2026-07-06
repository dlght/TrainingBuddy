import type { DatabaseAdapter } from "../client";
import { runInTransaction } from "../migrate";
import { createExerciseRepository } from "../repositories/exerciseRepository";
import { createWorkoutRepository } from "../repositories/workoutRepository";
import type { Exercise, MuscleGroup } from "../../models/exercise";
import type { SeedWorkout } from "../../models/workout";
import { CURRENT_SEED_VERSION, hasSeedVersion, markSeedVersionApplied } from "./seedVersion";
import { starterSeedData } from "./sampleWorkouts";

const LOCAL_SEED_EXERCISE_ASSET_PREFIX = "assets/seed-exercises/";

export type StarterSeedData = {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  workouts: SeedWorkout[];
};

export type SeedLoadResult = {
  applied: boolean;
  version: string;
  muscleGroups: number;
  exercises: number;
  workouts: number;
};

export function verifySeedExerciseImageMappings(seedData: StarterSeedData): void {
  const missingLocalMappings = seedData.exercises.filter(
    (exercise) => !exercise.imageUrl.startsWith(LOCAL_SEED_EXERCISE_ASSET_PREFIX)
  );

  if (missingLocalMappings.length > 0) {
    throw new Error(
      `Seed exercises require bundled local image assets: ${missingLocalMappings
        .map((exercise) => exercise.id)
        .join(", ")}`
    );
  }
}

export async function loadSeedData(
  database: DatabaseAdapter,
  seedData: StarterSeedData = starterSeedData,
  version = CURRENT_SEED_VERSION
): Promise<SeedLoadResult> {
  verifySeedExerciseImageMappings(seedData);

  if (await hasSeedVersion(database, version)) {
    return {
      applied: false,
      version,
      muscleGroups: seedData.muscleGroups.length,
      exercises: seedData.exercises.length,
      workouts: seedData.workouts.length
    };
  }

  await runInTransaction(database, async () => {
    const exerciseRepository = createExerciseRepository(database);
    const workoutRepository = createWorkoutRepository(database);

    await exerciseRepository.upsertMuscleGroups(seedData.muscleGroups);
    await exerciseRepository.upsertExercises(seedData.exercises);

    for (const workout of seedData.workouts) {
      await workoutRepository.upsertSeedWorkout(workout);
    }

    await markSeedVersionApplied(database, version);
  });

  return {
    applied: true,
    version,
    muscleGroups: seedData.muscleGroups.length,
    exercises: seedData.exercises.length,
    workouts: seedData.workouts.length
  };
}
