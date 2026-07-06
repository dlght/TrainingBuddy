import type { DatabaseAdapter } from "../client";
import type { Exercise, MuscleGroup, MuscleGroupName } from "../../models/exercise";

type ExerciseRow = Omit<Exercise, "isWarmup"> & {
  isWarmup: number | boolean;
};

function toExercise(row: ExerciseRow): Exercise {
  return {
    ...row,
    isWarmup: Boolean(row.isWarmup)
  };
}

export function createExerciseRepository(database: DatabaseAdapter) {
  return {
    async upsertMuscleGroups(groups: MuscleGroup[]): Promise<void> {
      for (const group of groups) {
        await database.runAsync(
          `INSERT INTO muscle_groups (id, name)
           VALUES (?, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
          [group.id, group.name]
        );
      }
    },

    async upsertExercises(exercises: Exercise[]): Promise<void> {
      for (const exercise of exercises) {
        await database.runAsync(
          `INSERT INTO exercises (
              id,
              name,
              muscle_group_id,
              equipment,
              image_url,
              instructions,
              is_warmup,
              video_url,
              source,
              source_id,
              license_author,
              license_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              muscle_group_id = excluded.muscle_group_id,
              equipment = excluded.equipment,
              image_url = excluded.image_url,
              instructions = excluded.instructions,
              is_warmup = excluded.is_warmup,
              video_url = excluded.video_url,
              source = excluded.source,
              source_id = excluded.source_id,
              license_author = excluded.license_author,
              license_url = excluded.license_url`,
          [
            exercise.id,
            exercise.name,
            exercise.muscleGroupId,
            exercise.equipment,
            exercise.imageUrl,
            exercise.instructions,
            exercise.isWarmup ? 1 : 0,
            exercise.videoUrl,
            exercise.source,
            exercise.sourceId,
            exercise.licenseAuthor,
            exercise.licenseUrl
          ]
        );
      }
    },

    async listMuscleGroups(): Promise<MuscleGroup[]> {
      return database.getAllAsync<MuscleGroup>(
        "SELECT id, name FROM muscle_groups ORDER BY name ASC"
      );
    },

    async listExercises(): Promise<Exercise[]> {
      const rows = await database.getAllAsync<ExerciseRow>(
        `SELECT id,
                name,
                muscle_group_id as muscleGroupId,
                equipment,
                image_url as imageUrl,
                instructions,
                is_warmup as isWarmup,
                video_url as videoUrl,
                source,
                source_id as sourceId,
                license_author as licenseAuthor,
                license_url as licenseUrl
           FROM exercises
          ORDER BY name ASC`
      );

      return rows.map(toExercise);
    },

    async listExercisesByMuscleGroup(muscleGroupId: MuscleGroupName): Promise<Exercise[]> {
      const rows = await database.getAllAsync<ExerciseRow>(
        `SELECT id,
                name,
                muscle_group_id as muscleGroupId,
                equipment,
                image_url as imageUrl,
                instructions,
                is_warmup as isWarmup,
                video_url as videoUrl,
                source,
                source_id as sourceId,
                license_author as licenseAuthor,
                license_url as licenseUrl
           FROM exercises
          WHERE muscle_group_id = ?
          ORDER BY name ASC`,
        [muscleGroupId]
      );

      return rows.map(toExercise);
    },

    async getExerciseById(id: string): Promise<Exercise | null> {
      const row = await database.getFirstAsync<ExerciseRow>(
        `SELECT id,
                name,
                muscle_group_id as muscleGroupId,
                equipment,
                image_url as imageUrl,
                instructions,
                is_warmup as isWarmup,
                video_url as videoUrl,
                source,
                source_id as sourceId,
                license_author as licenseAuthor,
                license_url as licenseUrl
           FROM exercises
          WHERE id = ?
          LIMIT 1`,
        [id]
      );

      return row ? toExercise(row) : null;
    }
  };
}
