import { DatabaseSync } from "node:sqlite";

import { migrations, runMigrations } from "../../src/db/migrate";
import { createWorkoutRepository } from "../../src/db/repositories/workoutRepository";
import type { DatabaseAdapter, SqlParams } from "../../src/db/client";

function toArgs(params: SqlParams = []): unknown[] {
  return Array.isArray(params) ? params : Object.values(params);
}

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

async function seedFixture(adapter: DatabaseAdapter): Promise<void> {
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

describe("per-set plan CRUD via workoutRepository", () => {
  it("stores an explicit non-uniform plan and reads it back in set-number order", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedFixture(adapter);

    const repo = createWorkoutRepository(adapter);
    const workout = await repo.createWorkout({
      name: "Ramping Squats",
      userId: "u1",
      exercises: [
        {
          exerciseId: "squat",
          orderIndex: 0,
          targetSets: 2,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 15,
          supersetGroupId: null,
          setPlans: [
            { setNumber: 1, reps: 10, weight: 15 },
            { setNumber: 2, reps: 12, weight: 12 }
          ]
        }
      ]
    });

    expect(workout.exercises[0].setPlans).toEqual([
      { id: expect.any(String), workoutExerciseId: workout.exercises[0].id, setNumber: 1, reps: 10, weight: 15 },
      { id: expect.any(String), workoutExerciseId: workout.exercises[0].id, setNumber: 2, reps: 12, weight: 12 }
    ]);
  });

  it("derives a uniform plan when setPlans is omitted", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedFixture(adapter);

    const repo = createWorkoutRepository(adapter);
    const workout = await repo.createWorkout({
      name: "Uniform Squats",
      userId: "u1",
      exercises: [
        {
          exerciseId: "squat",
          orderIndex: 0,
          targetSets: 3,
          targetRepRangeLow: 8,
          targetRepRangeHigh: 8,
          targetRestSeconds: 60,
          targetWeight: 40,
          supersetGroupId: null
        }
      ]
    });

    expect(workout.exercises[0].setPlans.map((plan) => ({ setNumber: plan.setNumber, reps: plan.reps, weight: plan.weight }))).toEqual([
      { setNumber: 1, reps: 8, weight: 40 },
      { setNumber: 2, reps: 8, weight: 40 },
      { setNumber: 3, reps: 8, weight: 40 }
    ]);
  });

  it("updateWorkout replaces the plan and does not break existing logged history", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedFixture(adapter);

    const repo = createWorkoutRepository(adapter);
    const workout = await repo.createWorkout({
      name: "Squats",
      userId: "u1",
      exercises: [
        {
          exerciseId: "squat",
          orderIndex: 0,
          targetSets: 1,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 20,
          supersetGroupId: null
        }
      ]
    });
    const workoutExerciseId = workout.exercises[0].id;

    await adapter.runAsync(
      `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
       VALUES ('s1', ?, 'u1', '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', 'completed', 'Squats')`,
      [workout.id]
    );
    await adapter.runAsync(
      `INSERT INTO set_logs (id, session_id, workout_exercise_id, set_number, reps, weight, completed_at, exercise_name_snapshot)
       VALUES ('set1', 's1', ?, 1, 10, 20, '2026-01-01T00:30:00.000Z', 'Squat')`,
      [workoutExerciseId]
    );

    const updated = await repo.updateWorkout(workout.id, {
      name: "Squats",
      exercises: [
        {
          exerciseId: "squat",
          orderIndex: 0,
          targetSets: 2,
          targetRepRangeLow: 10,
          targetRepRangeHigh: 10,
          targetRestSeconds: 60,
          targetWeight: 20,
          supersetGroupId: null,
          setPlans: [
            { setNumber: 1, reps: 10, weight: 20 },
            { setNumber: 2, reps: 8, weight: 25 }
          ]
        }
      ]
    });

    expect(updated.exercises[0].id).toBe(workoutExerciseId);
    expect(updated.exercises[0].setPlans.map((plan) => ({ setNumber: plan.setNumber, reps: plan.reps, weight: plan.weight }))).toEqual([
      { setNumber: 1, reps: 10, weight: 20 },
      { setNumber: 2, reps: 8, weight: 25 }
    ]);

    const setLog = await adapter.getFirstAsync<{ id: string }>("SELECT id FROM set_logs WHERE id = 'set1'");
    expect(setLog).not.toBeNull();
  });
});
