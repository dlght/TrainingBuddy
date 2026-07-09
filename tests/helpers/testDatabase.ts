import type { DatabaseAdapter, DbRunResult, SqlParams, SqlValue } from "../../src/db/client";
import type { Exercise, MuscleGroup } from "../../src/models/exercise";
import type { SetLog, WorkoutSession } from "../../src/models/session";
import type { Workout, WorkoutExercise, WorkoutExerciseSetPlan } from "../../src/models/workout";
import type { UserProfile } from "../../src/models/user";

type SeedVersionRow = {
  id: string;
  appliedAt: string;
};

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function values(params?: SqlParams): SqlValue[] {
  if (!params) {
    return [];
  }

  return Array.isArray(params) ? params : Object.values(params);
}

export class TestDatabase implements DatabaseAdapter {
  readonly execStatements: string[] = [];
  readonly runStatements: string[] = [];
  readonly schemaMigrations = new Map<string, SeedVersionRow>();
  readonly seedVersions = new Map<string, SeedVersionRow>();
  readonly users = new Map<string, UserProfile>();
  readonly muscleGroups = new Map<string, MuscleGroup>();
  readonly exercises = new Map<string, Exercise>();
  readonly workouts = new Map<string, Workout>();
  readonly workoutExercises = new Map<string, WorkoutExercise>();
  readonly workoutExerciseSetPlans = new Map<string, WorkoutExerciseSetPlan>();
  readonly workoutSessions = new Map<string, WorkoutSession>();
  readonly setLogs = new Map<string, SetLog>();

  async execAsync(sql: string): Promise<void> {
    this.execStatements.push(sql);
  }

  private deleteSetPlansForWorkoutExercises(workoutExerciseIds: Set<string>): void {
    for (const [id, plan] of this.workoutExerciseSetPlans) {
      if (workoutExerciseIds.has(plan.workoutExerciseId)) {
        this.workoutExerciseSetPlans.delete(id);
      }
    }
  }

  async runAsync(sql: string, params?: SqlParams): Promise<DbRunResult> {
    const normalized = normalizeSql(sql);
    const row = values(params);

    this.runStatements.push(sql);

    if (normalized.startsWith("insert or ignore into schema_migrations")) {
      this.schemaMigrations.set(String(row[0]), {
        id: String(row[0]),
        appliedAt: String(row[1])
      });
      return { changes: 1 };
    }

    if (normalized.startsWith("insert or replace into seed_versions")) {
      this.seedVersions.set(String(row[0]), {
        id: String(row[0]),
        appliedAt: String(row[1])
      });
      return { changes: 1 };
    }

    if (normalized.startsWith("insert into users")) {
      const profile: UserProfile = {
        id: String(row[0]),
        name: String(row[1]),
        bodyweight: Number(row[2]),
        height: row[3] === null ? null : Number(row[3]),
        weightUnit: row[4] as UserProfile["weightUnit"],
        experienceLevel: row[5] as UserProfile["experienceLevel"],
        goal: String(row[6]),
        createdAt: String(row[7])
      };

      this.users.set(profile.id, profile);
      return { changes: 1 };
    }

    if (normalized.startsWith("delete from users")) {
      this.users.delete(String(row[0]));
      return { changes: 1 };
    }

    if (normalized.startsWith("insert into muscle_groups")) {
      this.muscleGroups.set(String(row[0]) as MuscleGroup["id"], {
        id: String(row[0]) as MuscleGroup["id"],
        name: String(row[1]) as MuscleGroup["name"]
      });
      return { changes: 1 };
    }

    if (normalized.startsWith("insert into exercises")) {
      const exercise: Exercise = {
        id: String(row[0]),
        name: String(row[1]),
        muscleGroupId: String(row[2]) as Exercise["muscleGroupId"],
        equipment: row[3] === null ? null : String(row[3]),
        imageUrl: String(row[4]),
        instructions: String(row[5]),
        isWarmup: Boolean(row[6]),
        videoUrl: row[7] === null ? null : String(row[7]),
        source: row[8] === null ? null : String(row[8]),
        sourceId: row[9] === null ? null : String(row[9]),
        licenseAuthor: row[10] === null ? null : String(row[10]),
        licenseUrl: row[11] === null ? null : String(row[11])
      };

      this.exercises.set(exercise.id, exercise);
      return { changes: 1 };
    }

    if (normalized.startsWith("insert into workouts")) {
      const isSeedTemplate = row.length === 3;
      const workout: Workout = isSeedTemplate
        ? {
            id: String(row[0]),
            name: String(row[1]),
            userId: null,
            createdAt: String(row[2]),
            isTemplate: true,
            sourceTemplateId: null,
            isFavourite: false
          }
        : {
            id: String(row[0]),
            name: String(row[1]),
            userId: String(row[2]),
            createdAt: String(row[3]),
            isTemplate: false,
            sourceTemplateId: row[4] === null ? null : String(row[4]),
            isFavourite: false
          };

      this.workouts.set(workout.id, workout);
      return { changes: 1 };
    }

    if (normalized.startsWith("delete from workout_exercises where id =")) {
      const workoutExerciseId = String(row[0]);
      this.workoutExercises.delete(workoutExerciseId);
      this.deleteSetPlansForWorkoutExercises(new Set([workoutExerciseId]));
      return { changes: 1 };
    }

    if (normalized.startsWith("delete from workout_exercise_set_plans")) {
      const workoutExerciseId = String(row[0]);

      for (const [id, plan] of this.workoutExerciseSetPlans) {
        if (plan.workoutExerciseId === workoutExerciseId) {
          this.workoutExerciseSetPlans.delete(id);
        }
      }
      return { changes: 1 };
    }

    if (normalized.startsWith("insert into workout_exercise_set_plans")) {
      const plan: WorkoutExerciseSetPlan = {
        id: String(row[0]),
        workoutExerciseId: String(row[1]),
        setNumber: Number(row[2]),
        reps: Number(row[3]),
        weight: row[4] === null || row[4] === undefined ? null : Number(row[4])
      };

      this.workoutExerciseSetPlans.set(plan.id, plan);
      return { changes: 1 };
    }

    if (normalized.startsWith("delete from workout_exercises")) {
      const removedIds = new Set<string>();

      for (const [id, exercise] of this.workoutExercises) {
        if (exercise.workoutId === row[0]) {
          this.workoutExercises.delete(id);
          removedIds.add(id);
        }
      }
      this.deleteSetPlansForWorkoutExercises(removedIds);
      return { changes: 1 };
    }

    if (normalized.startsWith("insert into workout_exercises")) {
      const workoutId = String(row[1]);
      const orderIndex = Number(row[3]);
      const isUpsert = normalized.includes("on conflict");
      const existing = isUpsert
        ? Array.from(this.workoutExercises.values()).find(
            (exercise) => exercise.workoutId === workoutId && exercise.orderIndex === orderIndex
          )
        : undefined;

      const workoutExercise: WorkoutExercise = {
        id: existing?.id ?? String(row[0]),
        workoutId,
        exerciseId: String(row[2]),
        orderIndex,
        targetSets: Number(row[4]),
        targetRepRangeLow: Number(row[5]),
        targetRepRangeHigh: Number(row[6]),
        targetRestSeconds: Number(row[7]),
        targetWeight: row[8] === null || row[8] === undefined ? null : Number(row[8]),
        supersetGroupId: row[9] === null ? null : String(row[9]),
        // Per-set plans (workout_exercise_set_plans) aren't modeled by this mock;
        // real-SQLite integration tests cover that table directly.
        setPlans: existing?.setPlans ?? []
      };

      this.workoutExercises.set(workoutExercise.id, workoutExercise);
      return { changes: 1 };
    }

    if (normalized.startsWith("update workouts set name")) {
      const workout = this.workouts.get(String(row[1]));

      if (workout) {
        this.workouts.set(workout.id, { ...workout, name: String(row[0]) });
        return { changes: 1 };
      }

      return { changes: 0 };
    }

    if (normalized.startsWith("update workouts set is_favourite")) {
      const workout = this.workouts.get(String(row[1]));

      if (workout) {
        this.workouts.set(workout.id, { ...workout, isFavourite: Boolean(row[0]) });
        return { changes: 1 };
      }

      return { changes: 0 };
    }

    if (normalized.startsWith("delete from workouts")) {
      const workoutId = String(row[0]);
      const workout = this.workouts.get(workoutId);

      if (!workout) {
        return { changes: 0 };
      }

      this.workouts.delete(workoutId);

      const removedIds = new Set<string>();

      for (const [id, exercise] of this.workoutExercises) {
        if (exercise.workoutId === workoutId) {
          this.workoutExercises.delete(id);
          removedIds.add(id);
        }
      }
      this.deleteSetPlansForWorkoutExercises(removedIds);

      return { changes: 1 };
    }

    if (normalized.startsWith("insert into workout_sessions")) {
      const session: WorkoutSession = {
        id: String(row[0]),
        workoutId: String(row[1]),
        userId: String(row[2]),
        startedAt: String(row[3]),
        endedAt: row[4] === null ? null : String(row[4]),
        status: row[5] as WorkoutSession["status"],
        workoutNameSnapshot: String(row[6]),
        rating: row[7] === null || row[7] === undefined ? null : Number(row[7])
      };

      this.workoutSessions.set(session.id, session);
      return { changes: 1 };
    }

    if (normalized.startsWith("update workout_sessions set status = 'completed'")) {
      const session = this.workoutSessions.get(String(row[2]));

      if (session?.status === "active") {
        this.workoutSessions.set(session.id, {
          ...session,
          status: "completed",
          endedAt: String(row[0]),
          rating: row[1] === null ? null : Number(row[1])
        });
        return { changes: 1 };
      }

      return { changes: 0 };
    }

    if (normalized.startsWith("update workout_sessions set status")) {
      const session = this.workoutSessions.get(String(row[2]));

      if (session?.status === "active") {
        this.workoutSessions.set(session.id, {
          ...session,
          status: row[0] as WorkoutSession["status"],
          endedAt: String(row[1])
        });
        return { changes: 1 };
      }

      return { changes: 0 };
    }

    if (normalized.startsWith("insert into set_logs")) {
      const setLog: SetLog = {
        id: String(row[0]),
        sessionId: String(row[1]),
        workoutExerciseId: String(row[2]),
        setNumber: Number(row[3]),
        reps: Number(row[4]),
        weight: Number(row[5]),
        completedAt: String(row[6]),
        exerciseNameSnapshot: String(row[7]),
        targetRepsSnapshot: row[8] === null ? null : String(row[8]),
        targetRestSecondsSnapshot: row[9] === null ? null : Number(row[9])
      };

      this.setLogs.set(setLog.id, setLog);
      return { changes: 1 };
    }

    return { changes: 0 };
  }

  async getFirstAsync<T>(sql: string, params?: SqlParams): Promise<T | null> {
    const normalized = normalizeSql(sql);
    const row = values(params);

    if (normalized.includes("from schema_migrations")) {
      return (this.schemaMigrations.get(String(row[0])) ?? null) as T | null;
    }

    if (normalized.includes("from seed_versions")) {
      return (this.seedVersions.get(String(row[0])) ?? null) as T | null;
    }

    if (normalized.includes("from users") && normalized.includes("where id")) {
      return (this.users.get(String(row[0])) ?? null) as T | null;
    }

    if (normalized.includes("from users")) {
      return (Array.from(this.users.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null) as T | null;
    }

    if (normalized.includes("from workout_exercises") && normalized.includes("order_index")) {
      return (
        Array.from(this.workoutExercises.values()).find(
          (exercise) => exercise.workoutId === String(row[0]) && exercise.orderIndex === Number(row[1])
        ) ?? null
      ) as T | null;
    }

    if (normalized.includes("from workouts") && normalized.includes("where id")) {
      return (this.workouts.get(String(row[0])) ?? null) as T | null;
    }

    if (normalized.includes("from exercises") && normalized.includes("where id")) {
      return (this.exercises.get(String(row[0])) ?? null) as T | null;
    }

    if (normalized.includes("from workout_sessions") && normalized.includes("status = 'active'")) {
      return (
        Array.from(this.workoutSessions.values())
          .filter((session) => session.userId === row[0] && session.status === "active")
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
      ) as T | null;
    }

    if (normalized.includes("from workout_sessions") && normalized.includes("where id")) {
      return (this.workoutSessions.get(String(row[0])) ?? null) as T | null;
    }

    return null;
  }

  async getAllAsync<T>(sql: string, params?: SqlParams): Promise<T[]> {
    const normalized = normalizeSql(sql);
    const row = values(params);

    if (normalized.includes("from muscle_groups")) {
      return Array.from(this.muscleGroups.values()).sort((a, b) => a.name.localeCompare(b.name)) as T[];
    }

    if (normalized.includes("from exercises")) {
      const exercises = Array.from(this.exercises.values());
      const filtered = normalized.includes("where muscle_group_id")
        ? exercises.filter((exercise) => exercise.muscleGroupId === row[0])
        : exercises;

      return filtered.sort((a, b) => a.name.localeCompare(b.name)) as T[];
    }

    if (normalized.includes("from workouts") && normalized.includes("where is_template")) {
      return Array.from(this.workouts.values())
        .filter((workout) => workout.isTemplate)
        .sort((a, b) => a.name.localeCompare(b.name)) as T[];
    }

    if (normalized.includes("from workouts")) {
      return Array.from(this.workouts.values()).sort((a, b) => {
        if (a.isTemplate !== b.isTemplate) {
          return a.isTemplate ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      }) as T[];
    }

    // Checked before the generic "workout_exercises" match below: the bulk
    // set-plans query embeds a "FROM workout_exercises" subquery, which would
    // otherwise be caught by that broader, less-specific check first.
    if (normalized.includes("from workout_exercise_set_plans")) {
      const matchingWorkoutExerciseIds = normalized.includes("in (select id from workout_exercises")
        ? new Set(
            Array.from(this.workoutExercises.values())
              .filter((exercise) => exercise.workoutId === row[0])
              .map((exercise) => exercise.id)
          )
        : new Set([String(row[0])]);

      return Array.from(this.workoutExerciseSetPlans.values())
        .filter((plan) => matchingWorkoutExerciseIds.has(plan.workoutExerciseId))
        .sort((a, b) => a.setNumber - b.setNumber) as T[];
    }

    if (normalized.includes("from workout_exercises")) {
      return Array.from(this.workoutExercises.values())
        .filter((exercise) => exercise.workoutId === row[0])
        .sort((a, b) => a.orderIndex - b.orderIndex) as T[];
    }

    if (
      normalized.includes("from set_logs sl") &&
      normalized.includes("join workout_sessions") &&
      normalized.includes("join workout_exercises")
    ) {
      const exerciseId = String(row[0]);
      const completedExerciseSets = Array.from(this.setLogs.values())
        .filter((setLog) => {
          const session = this.workoutSessions.get(setLog.sessionId);
          const workoutExercise = this.workoutExercises.get(setLog.workoutExerciseId);

          return session?.status === "completed" && workoutExercise?.exerciseId === exerciseId;
        })
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.setNumber - b.setNumber);

      if (normalized.includes("sum(sl.reps * sl.weight)")) {
        const grouped = new Map<string, { sessionId: string; completedAt: string; volume: number }>();

        for (const setLog of completedExerciseSets) {
          const current = grouped.get(setLog.sessionId);

          grouped.set(setLog.sessionId, {
            sessionId: setLog.sessionId,
            completedAt:
              current && current.completedAt.localeCompare(setLog.completedAt) >= 0
                ? current.completedAt
                : setLog.completedAt,
            volume: (current?.volume ?? 0) + setLog.reps * (setLog.weight ?? 0)
          });
        }

        return Array.from(grouped.values()).sort((a, b) => a.completedAt.localeCompare(b.completedAt)) as T[];
      }

      if (normalized.includes("sl.weight") && !normalized.includes("sl.set_number")) {
        return completedExerciseSets
          .filter((setLog) => setLog.weight !== null)
          .map((setLog) => ({
            sessionId: setLog.sessionId,
            completedAt: setLog.completedAt,
            weight: setLog.weight
          })) as T[];
      }

      return completedExerciseSets.map((setLog) => {
        const session = this.workoutSessions.get(setLog.sessionId);

        return {
          sessionId: setLog.sessionId,
          workoutNameSnapshot: session?.workoutNameSnapshot ?? "",
          completedAt: setLog.completedAt,
          setNumber: setLog.setNumber,
          reps: setLog.reps,
          weight: setLog.weight,
          exerciseNameSnapshot: setLog.exerciseNameSnapshot
        };
      }) as T[];
    }

    if (normalized.includes("from set_logs") && normalized.includes("where session_id")) {
      return Array.from(this.setLogs.values())
        .filter((setLog) => setLog.sessionId === row[0])
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.setNumber - b.setNumber) as T[];
    }

    return [];
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return task();
  }
}
