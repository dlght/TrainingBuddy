import type { DatabaseAdapter } from "./client";

export const initialMigrationSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  bodyweight REAL NOT NULL CHECK (bodyweight > 0),
  height REAL CHECK (height IS NULL OR height > 0),
  weight_unit TEXT NOT NULL CHECK (weight_unit IN ('kg', 'lb')),
  experience_level TEXT NOT NULL CHECK (length(trim(experience_level)) > 0),
  goal TEXT NOT NULL CHECK (length(trim(goal)) > 0),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS muscle_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core'))
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  muscle_group_id TEXT NOT NULL REFERENCES muscle_groups(id) ON DELETE RESTRICT,
  equipment TEXT,
  image_url TEXT NOT NULL CHECK (length(trim(image_url)) > 0),
  instructions TEXT NOT NULL CHECK (length(trim(instructions)) > 0),
  is_warmup INTEGER NOT NULL DEFAULT 0 CHECK (is_warmup IN (0, 1)),
  video_url TEXT,
  source TEXT,
  source_id TEXT,
  license_author TEXT,
  license_url TEXT
);

CREATE INDEX IF NOT EXISTS exercises_muscle_group_idx ON exercises(muscle_group_id);
CREATE INDEX IF NOT EXISTS exercises_source_idx ON exercises(source, source_id);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  is_template INTEGER NOT NULL DEFAULT 0 CHECK (is_template IN (0, 1)),
  source_template_id TEXT REFERENCES workouts(id) ON DELETE SET NULL,
  CHECK ((is_template = 1 AND user_id IS NULL) OR is_template = 0)
);

CREATE INDEX IF NOT EXISTS workouts_user_idx ON workouts(user_id);
CREATE INDEX IF NOT EXISTS workouts_template_idx ON workouts(is_template);
CREATE INDEX IF NOT EXISTS workouts_source_template_idx ON workouts(source_template_id);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  target_sets INTEGER NOT NULL CHECK (target_sets > 0),
  target_rep_range_low INTEGER NOT NULL CHECK (target_rep_range_low > 0),
  target_rep_range_high INTEGER NOT NULL CHECK (target_rep_range_high >= target_rep_range_low),
  target_rest_seconds INTEGER NOT NULL CHECK (target_rest_seconds >= 0),
  superset_group_id TEXT,
  UNIQUE (workout_id, order_index)
);

CREATE INDEX IF NOT EXISTS workout_exercises_workout_idx ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_idx ON workout_exercises(exercise_id);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'discarded')),
  workout_name_snapshot TEXT NOT NULL CHECK (length(trim(workout_name_snapshot)) > 0)
);

CREATE INDEX IF NOT EXISTS workout_sessions_user_status_idx ON workout_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS workout_sessions_workout_idx ON workout_sessions(workout_id);

CREATE TABLE IF NOT EXISTS set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE RESTRICT,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  reps INTEGER NOT NULL CHECK (reps >= 0),
  weight REAL NOT NULL CHECK (weight >= 0),
  effort_rpe INTEGER NOT NULL CHECK (effort_rpe BETWEEN 1 AND 10),
  completed_at TEXT NOT NULL,
  exercise_name_snapshot TEXT NOT NULL CHECK (length(trim(exercise_name_snapshot)) > 0),
  target_reps_snapshot TEXT,
  target_rest_seconds_snapshot INTEGER CHECK (target_rest_seconds_snapshot IS NULL OR target_rest_seconds_snapshot >= 0)
);

CREATE INDEX IF NOT EXISTS set_logs_session_idx ON set_logs(session_id);
CREATE INDEX IF NOT EXISTS set_logs_workout_exercise_idx ON set_logs(workout_exercise_id);

CREATE TABLE IF NOT EXISTS seed_versions (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`;

export type Migration = {
  id: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    id: "0001_initial",
    sql: initialMigrationSql
  }
];

export async function runInTransaction<T>(
  database: DatabaseAdapter,
  task: () => Promise<T>
): Promise<T> {
  if (database.withTransactionAsync) {
    return database.withTransactionAsync(task);
  }

  return task();
}

export async function runMigrations(
  database: DatabaseAdapter,
  migrationList: Migration[] = migrations
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  for (const migration of migrationList) {
    const applied = await database.getFirstAsync<{ id: string }>(
      "SELECT id FROM schema_migrations WHERE id = ? LIMIT 1",
      [migration.id]
    );

    if (applied) {
      continue;
    }

    await runInTransaction(database, async () => {
      await database.execAsync(migration.sql);
      await database.runAsync(
        "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
        [migration.id, new Date().toISOString()]
      );
    });
  }
}
