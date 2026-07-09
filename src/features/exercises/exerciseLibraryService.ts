import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { Exercise, MuscleGroup, MuscleGroupName } from "@/models/exercise";

import {
  getExercisesForMuscleGroup,
  getFirstAvailableMuscleGroup,
  groupExercisesByMuscleGroup,
  type GroupedExercises,
  sortMuscleGroups
} from "./exerciseSelectors";

export type ExerciseLibraryData = {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  groupedExercises: GroupedExercises[];
  defaultMuscleGroupId: MuscleGroupName | null;
};

export type ExerciseLibraryService = {
  getLibraryData(): Promise<ExerciseLibraryData>;
  listExercisesByMuscleGroup(muscleGroupId: MuscleGroupName): Promise<Exercise[]>;
  getExerciseById(exerciseId: string): Promise<Exercise | null>;
};

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group_id: MuscleGroupName;
  equipment: string | null;
  image_url: string;
  instructions: string;
  is_warmup: boolean;
  video_url: string | null;
  source: string | null;
  source_id: string | null;
  license_author: string | null;
  license_url: string | null;
};

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroupId: row.muscle_group_id,
    equipment: row.equipment,
    imageUrl: row.image_url,
    instructions: row.instructions,
    isWarmup: row.is_warmup,
    videoUrl: row.video_url,
    source: row.source,
    sourceId: row.source_id,
    licenseAuthor: row.license_author,
    licenseUrl: row.license_url
  };
}

export function createExerciseLibraryService(client: SupabaseClient): ExerciseLibraryService {
  return {
    async getLibraryData() {
      const [muscleGroupsResult, exercisesResult] = await Promise.all([
        client.from("muscle_groups").select("*").order("name"),
        client.from("exercises").select("*").order("name")
      ]);

      if (muscleGroupsResult.error) {
        throw muscleGroupsResult.error;
      }

      if (exercisesResult.error) {
        throw exercisesResult.error;
      }

      const muscleGroups = (muscleGroupsResult.data ?? []) as MuscleGroup[];
      const exercises = ((exercisesResult.data ?? []) as ExerciseRow[]).map(toExercise);
      const groupedExercises = groupExercisesByMuscleGroup(exercises, muscleGroups);

      return {
        muscleGroups: sortMuscleGroups(muscleGroups),
        exercises,
        groupedExercises,
        defaultMuscleGroupId: getFirstAvailableMuscleGroup(groupedExercises)
      };
    },

    async listExercisesByMuscleGroup(muscleGroupId) {
      const { data, error } = await client
        .from("exercises")
        .select("*")
        .eq("muscle_group_id", muscleGroupId)
        .order("name");

      if (error) {
        throw error;
      }

      const exercises = ((data ?? []) as ExerciseRow[]).map(toExercise);

      return getExercisesForMuscleGroup(exercises, muscleGroupId);
    },

    async getExerciseById(exerciseId) {
      const { data, error } = await client.from("exercises").select("*").eq("id", exerciseId).maybeSingle();

      if (error) {
        throw error;
      }

      return data ? toExercise(data as ExerciseRow) : null;
    }
  };
}

export const exerciseLibraryService: ExerciseLibraryService = createExerciseLibraryService(supabase);
