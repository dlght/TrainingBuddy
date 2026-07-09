import { DatabaseSync } from "node:sqlite";

import { migrations, runMigrations } from "../../src/db/migrate";
import { createSessionRepository } from "../../src/db/repositories/sessionRepository";
import type { DatabaseAdapter, SqlParams } from "../../src/db/client";

function toArgs(params: SqlParams = []): unknown[] {
  return Array.isArray(params) ? params : Object.values(params);
}

/**
 * Uses a real SQLite engine (not the hand-rolled TestDatabase mock used
 * elsewhere in this suite) because that mock does not enforce real column
 * constraints and has previously let schema-drift bugs slip past a fully
 * "passing" test suite.
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

/** Simulates a device that ran the app before workout_sessions.rating existed. */
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
    CREATE TABLE workout_exercises (
      id TEXT PRIMARY KEY, workout_id TEXT NOT NULL REFERENCES workouts(id), exercise_id TEXT NOT NULL REFERENCES exercises(id),
      order_index INTEGER NOT NULL, target_sets INTEGER NOT NULL, target_rep_range_low INTEGER NOT NULL,
      target_rep_range_high INTEGER NOT NULL, target_rest_seconds INTEGER NOT NULL, superset_group_id TEXT,
      UNIQUE (workout_id, order_index)
    );
    -- Legacy shape: no rating column, like a device that ran the app before this fix.
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
  db.exec(`INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id, is_favourite)
    VALUES ('w1', 'Test Workout', 'u1', '2026-01-01T00:00:00.000Z', 0, NULL, 0);`);
  db.exec(`INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
    VALUES ('s1', 'w1', 'u1', '2026-01-01T09:00:00.000Z', '2026-01-01T09:45:00.000Z', 'completed', 'Test Workout');`);

  return db;
}

describe("workout_sessions.rating migration", () => {
  it("adds a nullable rating column on a fresh install", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);

    const columns = await adapter.getAllAsync<{ name: string; notnull: number }>(
      "PRAGMA table_info(workout_sessions);"
    );
    const ratingColumn = columns.find((column) => column.name === "rating");

    expect(ratingColumn).toBeDefined();
    expect(ratingColumn?.notnull).toBe(0);
  });

  it("self-heals a drifted device without losing existing rows", async () => {
    const db = createDriftedDatabase();
    const adapter = makeRealAdapter(db);

    await expect(runMigrations(adapter, migrations)).resolves.not.toThrow();

    const columns = await adapter.getAllAsync<{ name: string }>("PRAGMA table_info(workout_sessions);");
    expect(columns.map((column) => column.name)).toContain("rating");

    const existingRow = await adapter.getFirstAsync<{ id: string; status: string }>(
      "SELECT id, status FROM workout_sessions WHERE id = 's1'"
    );
    expect(existingRow).toMatchObject({ id: "s1", status: "completed" });
  });

  it("is idempotent across repeated runs", async () => {
    const db = createDriftedDatabase();
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);
    await expect(runMigrations(adapter, migrations)).resolves.not.toThrow();
  });

  it("persists a rating through sessionRepository.completeSession and reads it back", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);

    await adapter.runAsync(
      `INSERT INTO users (id, name, bodyweight, height, weight_unit, experience_level, goal, created_at)
       VALUES ('u1', 'Alex', 75, NULL, 'kg', 'new', 'Build consistency', '2026-01-01T00:00:00.000Z')`
    );
    await adapter.runAsync(
      `INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id)
       VALUES ('w1', 'Test Workout', 'u1', '2026-01-01T00:00:00.000Z', 0, NULL)`
    );

    const repository = createSessionRepository(adapter);
    const session = await repository.startSession({
      workoutId: "w1",
      userId: "u1",
      workoutNameSnapshot: "Test Workout",
      startedAt: "2026-01-02T09:00:00.000Z"
    });

    expect(session.rating).toBeNull();

    await repository.completeSession(session.id, { rating: 4, endedAt: "2026-01-02T09:45:00.000Z" });

    const completed = await repository.getSessionById(session.id);
    expect(completed).toMatchObject({ status: "completed", rating: 4, endedAt: "2026-01-02T09:45:00.000Z" });
  });

  it("completes a session with no rating supplied, leaving it null", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);

    await runMigrations(adapter, migrations);

    await adapter.runAsync(
      `INSERT INTO users (id, name, bodyweight, height, weight_unit, experience_level, goal, created_at)
       VALUES ('u1', 'Alex', 75, NULL, 'kg', 'new', 'Build consistency', '2026-01-01T00:00:00.000Z')`
    );
    await adapter.runAsync(
      `INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id)
       VALUES ('w1', 'Test Workout', 'u1', '2026-01-01T00:00:00.000Z', 0, NULL)`
    );

    const repository = createSessionRepository(adapter);
    const session = await repository.startSession({
      workoutId: "w1",
      userId: "u1",
      workoutNameSnapshot: "Test Workout"
    });

    await repository.completeSession(session.id);

    const completed = await repository.getSessionById(session.id);
    expect(completed?.rating).toBeNull();
    expect(completed?.status).toBe("completed");
  });
});
