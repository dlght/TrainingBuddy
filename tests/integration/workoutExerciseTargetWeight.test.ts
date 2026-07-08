import { DatabaseSync } from "node:sqlite";

import { migrations, runMigrations } from "../../src/db/migrate";
import type { DatabaseAdapter, SqlParams } from "../../src/db/client";

function toArgs(params: SqlParams = []): unknown[] {
  return Array.isArray(params) ? params : Object.values(params);
}

/**
 * Uses a real SQLite engine (not the hand-rolled TestDatabase mock used
 * elsewhere in this suite) because that mock does not enforce real column
 * constraints and has previously let schema-drift bugs (is_favourite,
 * effort_rpe, set_logs.weight) slip past a fully "passing" test suite.
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

/** Simulates a device that ran the app before target_weight existed. */
function createDriftedDatabase(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`);
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, bodyweight REAL NOT NULL, height REAL,
      weight_unit TEXT NOT NULL, experience_level TEXT NOT NULL, goal TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE muscle_groups (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
    CREATE TABLE exercises (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, muscle_group_id TEXT NOT NULL REFERENCES muscle_groups(id),
      equipment TEXT, image_url TEXT NOT NULL, instructions TEXT NOT NULL, is_warmup INTEGER NOT NULL DEFAULT 0,
      video_url TEXT, source TEXT, source_id TEXT, license_author TEXT, license_url TEXT
    );
    CREATE TABLE workouts (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, user_id TEXT REFERENCES users(id), created_at TEXT NOT NULL,
      is_template INTEGER NOT NULL DEFAULT 0, source_template_id TEXT, is_favourite INTEGER NOT NULL DEFAULT 0
    );
    -- Legacy shape: no target_weight column, like a device that ran the app before this fix.
    CREATE TABLE workout_exercises (
      id TEXT PRIMARY KEY, workout_id TEXT NOT NULL REFERENCES workouts(id), exercise_id TEXT NOT NULL REFERENCES exercises(id),
      order_index INTEGER NOT NULL, target_sets INTEGER NOT NULL, target_rep_range_low INTEGER NOT NULL,
      target_rep_range_high INTEGER NOT NULL, target_rest_seconds INTEGER NOT NULL, superset_group_id TEXT,
      UNIQUE (workout_id, order_index)
    );
    CREATE TABLE workout_sessions (
      id TEXT PRIMARY KEY, workout_id TEXT NOT NULL REFERENCES workouts(id), user_id TEXT NOT NULL REFERENCES users(id),
      started_at TEXT NOT NULL, ended_at TEXT, status TEXT NOT NULL, workout_name_snapshot TEXT NOT NULL
    );
    CREATE TABLE set_logs (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES workout_sessions(id),
      workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id), set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL, weight REAL CHECK (weight IS NULL OR weight >= 0),
      completed_at TEXT NOT NULL, exercise_name_snapshot TEXT NOT NULL,
      target_reps_snapshot TEXT, target_rest_seconds_snapshot INTEGER
    );
    CREATE TABLE seed_versions (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
  `);
  db.exec(`INSERT INTO schema_migrations (id, applied_at) VALUES ('0001_initial', '2026-01-01T00:00:00.000Z');`);
  db.exec(`INSERT INTO users (id, name, bodyweight, height, weight_unit, experience_level, goal, created_at)
    VALUES ('u1', 'Alex', 75, NULL, 'kg', 'new', 'Build consistency', '2026-01-01T00:00:00.000Z');`);
  db.exec(`INSERT INTO muscle_groups (id, name) VALUES ('legs', 'legs');`);
  db.exec(`INSERT INTO exercises (id, name, muscle_group_id, image_url, instructions, is_warmup)
    VALUES ('squat', 'Barbell Squat', 'legs', 'assets/seed-exercises/placeholder.txt', 'Squat.', 0);`);
  db.exec(`INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id, is_favourite)
    VALUES ('w1', 'Test Workout', 'u1', '2026-01-01T00:00:00.000Z', 0, NULL, 0);`);
  db.exec(`INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, target_sets, target_rep_range_low, target_rep_range_high, target_rest_seconds, superset_group_id)
    VALUES ('we1', 'w1', 'squat', 0, 3, 10, 10, 60, NULL);`);

  return db;
}

describe("workout_exercises.target_weight migration", () => {
  it("adds a nullable target_weight column on a fresh install", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);

    const columns = await adapter.getAllAsync<{ name: string; notnull: number }>(
      "PRAGMA table_info(workout_exercises);"
    );
    const targetWeightColumn = columns.find((column) => column.name === "target_weight");

    expect(targetWeightColumn).toBeDefined();
    expect(targetWeightColumn?.notnull).toBe(0);
  });

  it("self-heals a drifted device without losing existing rows", async () => {
    const db = createDriftedDatabase();
    const adapter = makeRealAdapter(db);

    await expect(runMigrations(adapter, migrations)).resolves.not.toThrow();

    const columns = await adapter.getAllAsync<{ name: string }>("PRAGMA table_info(workout_exercises);");
    expect(columns.map((column) => column.name)).toContain("target_weight");

    const existingRow = await adapter.getFirstAsync<{ id: string; targetSets: number }>(
      "SELECT id, target_sets as targetSets FROM workout_exercises WHERE id = 'we1'"
    );
    expect(existingRow).toMatchObject({ id: "we1", targetSets: 3 });
  });

  it("allows setting and reading back a target_weight value after healing", async () => {
    const db = createDriftedDatabase();
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);

    await expect(
      adapter.runAsync("UPDATE workout_exercises SET target_weight = ? WHERE id = ?", [42.5, "we1"])
    ).resolves.not.toThrow();

    const updated = await adapter.getFirstAsync<{ targetWeight: number | null }>(
      "SELECT target_weight as targetWeight FROM workout_exercises WHERE id = 'we1'"
    );
    expect(updated?.targetWeight).toBe(42.5);
  });

  it("rejects a negative target_weight", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);

    await adapter.runAsync(
      `INSERT INTO muscle_groups (id, name) VALUES ('legs', 'legs')`
    );
    await adapter.runAsync(
      `INSERT INTO exercises (id, name, muscle_group_id, image_url, instructions, is_warmup)
       VALUES ('squat', 'Barbell Squat', 'legs', 'assets/seed-exercises/placeholder.txt', 'Squat.', 0)`
    );
    await adapter.runAsync(
      `INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id)
       VALUES ('w1', 'Test Workout', NULL, '2026-01-01T00:00:00.000Z', 0, NULL)`
    );

    await expect(
      adapter.runAsync(
        `INSERT INTO workout_exercises (
            id, workout_id, exercise_id, order_index, target_sets, target_rep_range_low,
            target_rep_range_high, target_rest_seconds, target_weight, superset_group_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["we1", "w1", "squat", 0, 3, 10, 10, 60, -5, null]
      )
    ).rejects.toThrow();
  });

  it("is idempotent across repeated runs", async () => {
    const db = createDriftedDatabase();
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);
    await expect(runMigrations(adapter, migrations)).resolves.not.toThrow();
  });
});
