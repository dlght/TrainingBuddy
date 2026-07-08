import { DatabaseSync } from "node:sqlite";

import { migrations, runMigrations } from "../../src/db/migrate";
import { createWorkoutRepository } from "../../src/db/repositories/workoutRepository";
import type { DatabaseAdapter, SqlParams } from "../../src/db/client";

function toArgs(params: SqlParams = []): unknown[] {
  return Array.isArray(params) ? params : Object.values(params);
}

/**
 * Uses a real SQLite engine with foreign_keys ON — this bug (re-saving a
 * workout that has logged history threw "FOREIGN KEY constraint failed" and
 * broke the entire app, since db init calls loadSeedData -> upsertSeedWorkout
 * unconditionally) only reproduces with real FK enforcement, which the
 * hand-rolled TestDatabase mock doesn't have.
 */
function makeRealAdapter(db: DatabaseSync): DatabaseAdapter {
  return {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
    runAsync: async (sql: string, params?: SqlParams) => {
      const info = db.prepare(sql).run(...(toArgs(params) as never[]));
      return { changes: Number(info.changes) };
    },
    getFirstAsync: async <T>(sql: string, params?: SqlParams) => {
      return (db.prepare(sql).get(...(toArgs(params) as never[])) as T) ?? null;
    },
    getAllAsync: async <T>(sql: string, params?: SqlParams) => {
      return db.prepare(sql).all(...(toArgs(params) as never[])) as T[];
    },
    withTransactionAsync: async <T>(task: () => Promise<T>) => {
      db.exec("BEGIN");
      try {
        const result = await task();
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
  };
}

async function seedUserAndMuscleGroup(adapter: DatabaseAdapter): Promise<void> {
  await adapter.runAsync(
    `INSERT INTO users (id, name, bodyweight, weight_unit, experience_level, goal, created_at)
     VALUES ('u1', 'Alex', 75, 'kg', 'new', 'Build consistency', '2026-01-01T00:00:00.000Z')`
  );
  await adapter.runAsync(`INSERT INTO muscle_groups (id, name) VALUES ('legs', 'legs')`);
  await adapter.runAsync(
    `INSERT INTO exercises (id, name, muscle_group_id, image_url, instructions, is_warmup)
     VALUES ('squat', 'Squat', 'legs', 'assets/seed-exercises/placeholder.txt', 'Squat.', 0)`
  );
}

describe("re-saving a workout that already has logged history", () => {
  it("upsertSeedWorkout does not throw and preserves the set_logs' workout_exercise_id", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedUserAndMuscleGroup(adapter);

    const repo = createWorkoutRepository(adapter);
    await repo.upsertSeedWorkout({
      id: "workout-a",
      name: "Full Body A",
      exercises: [
        {
          exerciseId: "squat",
          orderIndex: 0,
          targetSets: 3,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: null,
          supersetGroupId: null
        }
      ]
    });

    const before = await repo.getWorkoutWithExercises("workout-a");
    const workoutExerciseId = before!.exercises[0].id;

    // Simulate a logged session against that exercise (what breaks the naive DELETE+INSERT).
    await adapter.runAsync(
      `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
       VALUES ('s1', 'workout-a', 'u1', '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', 'completed', 'Full Body A')`
    );
    await adapter.runAsync(
      `INSERT INTO set_logs (id, session_id, workout_exercise_id, set_number, reps, weight, completed_at, exercise_name_snapshot)
       VALUES ('set1', 's1', ?, 1, 10, 40, '2026-01-01T00:30:00.000Z', 'Squat')`,
      [workoutExerciseId]
    );

    // Re-run the seed with a new default weight, like a real seed-version bump does.
    await expect(
      repo.upsertSeedWorkout({
        id: "workout-a",
        name: "Full Body A",
        exercises: [
          {
            exerciseId: "squat",
            orderIndex: 0,
            targetSets: 3,
            targetRepRangeLow: 10,
            targetRepRangeHigh: 10,
            targetRestSeconds: 60,
            targetWeight: 40,
            supersetGroupId: null
          }
        ]
      })
    ).resolves.not.toThrow();

    const after = await repo.getWorkoutWithExercises("workout-a");
    expect(after!.exercises[0].id).toBe(workoutExerciseId);
    expect(after!.exercises[0].targetWeight).toBe(40);

    const setLog = await adapter.getFirstAsync<{ id: string }>(
      "SELECT id FROM set_logs WHERE id = 'set1'"
    );
    expect(setLog).not.toBeNull();
  });

  it("updateWorkout (builder save) does not throw when editing a custom workout with logged history", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedUserAndMuscleGroup(adapter);

    const repo = createWorkoutRepository(adapter);
    const workout = await repo.createWorkout({
      name: "My Workout",
      userId: "u1",
      exercises: [
        {
          exerciseId: "squat",
          orderIndex: 0,
          targetSets: 3,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 40,
          supersetGroupId: null
        }
      ]
    });
    const workoutExerciseId = workout.exercises[0].id;

    await adapter.runAsync(
      `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
       VALUES ('s1', ?, 'u1', '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', 'completed', 'My Workout')`,
      [workout.id]
    );
    await adapter.runAsync(
      `INSERT INTO set_logs (id, session_id, workout_exercise_id, set_number, reps, weight, completed_at, exercise_name_snapshot)
       VALUES ('set1', 's1', ?, 1, 10, 40, '2026-01-01T00:30:00.000Z', 'Squat')`,
      [workoutExerciseId]
    );

    await expect(
      repo.updateWorkout(workout.id, {
        name: "My Workout Renamed",
        exercises: [
          {
            exerciseId: "squat",
            orderIndex: 0,
            targetSets: 4,
            targetRepRangeLow: 8,
            targetRepRangeHigh: 8,
            targetRestSeconds: 90,
            targetWeight: 45,
            supersetGroupId: null
          }
        ]
      })
    ).resolves.not.toThrow();

    const after = await repo.getWorkoutWithExercises(workout.id);
    expect(after!.exercises[0].id).toBe(workoutExerciseId);
    expect(after!.exercises[0].targetSets).toBe(4);
    expect(after!.exercises[0].targetWeight).toBe(45);
  });
});
