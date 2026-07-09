import type { DatabaseAdapter } from "./client";
import { createLocalId } from "../utils/ids";

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
  target_weight REAL CHECK (target_weight IS NULL OR target_weight >= 0),
  superset_group_id TEXT,
  UNIQUE (workout_id, order_index)
);

CREATE INDEX IF NOT EXISTS workout_exercises_workout_idx ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_idx ON workout_exercises(exercise_id);

CREATE TABLE IF NOT EXISTS workout_exercise_set_plans (
  id TEXT PRIMARY KEY,
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight REAL CHECK (weight IS NULL OR weight >= 0),
  UNIQUE (workout_exercise_id, set_number)
);

CREATE INDEX IF NOT EXISTS workout_exercise_set_plans_workout_exercise_idx ON workout_exercise_set_plans(workout_exercise_id);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'discarded')),
  workout_name_snapshot TEXT NOT NULL CHECK (length(trim(workout_name_snapshot)) > 0),
  rating INTEGER
);

CREATE INDEX IF NOT EXISTS workout_sessions_user_status_idx ON workout_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS workout_sessions_workout_idx ON workout_sessions(workout_id);

CREATE TABLE IF NOT EXISTS set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE RESTRICT,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  reps INTEGER NOT NULL CHECK (reps >= 0),
  weight REAL CHECK (weight IS NULL OR weight >= 0),
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

/**
 * Ensures the workouts.is_favourite column (and its index) exist, regardless of
 * what schema_migrations claims. This column was historically added via an
 * ID-tracked ALTER TABLE migration, but a since-fixed concurrency bug could leave
 * a device with the migration ID marked "applied" while the ALTER TABLE itself
 * never actually committed (rolled back by a racing transaction on the same
 * connection). Checking the live schema directly makes this self-healing instead
 * of permanently trusting stale bookkeeping.
 */
export async function ensureFavouriteColumn(database: DatabaseAdapter): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(workouts);");
  const hasColumn = columns.some((column) => column.name === "is_favourite");

  if (!hasColumn) {
    await database.execAsync("ALTER TABLE workouts ADD COLUMN is_favourite INTEGER NOT NULL DEFAULT 0;");
  }

  await database.execAsync("CREATE INDEX IF NOT EXISTS workouts_favourite_idx ON workouts(is_favourite);");
}

/**
 * Relaxes set_logs.weight from NOT NULL to nullable so bodyweight exercises can
 * be logged with reps only. SQLite has no ALTER COLUMN to drop a NOT NULL
 * constraint, so this rebuilds the table: create a replacement with the desired
 * schema, copy existing rows across, drop the old table, rename the new one back,
 * and recreate its indexes — all in one transaction. Checking the live schema via
 * PRAGMA table_info (rather than trusting migration-ID bookkeeping) keeps this
 * self-healing and idempotent, consistent with ensureFavouriteColumn above.
 */
export async function ensureNullableSetLogsWeight(database: DatabaseAdapter): Promise<void> {
  const columns = await database.getAllAsync<{ name: string; notnull: number }>(
    "PRAGMA table_info(set_logs);"
  );
  const weightColumn = columns.find((column) => column.name === "weight");

  if (!weightColumn || weightColumn.notnull === 0) {
    return;
  }

  await runInTransaction(database, async () => {
    await database.execAsync(`
      CREATE TABLE set_logs_new (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
        workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE RESTRICT,
        set_number INTEGER NOT NULL CHECK (set_number > 0),
        reps INTEGER NOT NULL CHECK (reps >= 0),
        weight REAL CHECK (weight IS NULL OR weight >= 0),
        completed_at TEXT NOT NULL,
        exercise_name_snapshot TEXT NOT NULL CHECK (length(trim(exercise_name_snapshot)) > 0),
        target_reps_snapshot TEXT,
        target_rest_seconds_snapshot INTEGER CHECK (target_rest_seconds_snapshot IS NULL OR target_rest_seconds_snapshot >= 0)
      );
    `);
    await database.execAsync(`
      INSERT INTO set_logs_new (
        id, session_id, workout_exercise_id, set_number, reps, weight,
        completed_at, exercise_name_snapshot, target_reps_snapshot, target_rest_seconds_snapshot
      )
      SELECT
        id, session_id, workout_exercise_id, set_number, reps, weight,
        completed_at, exercise_name_snapshot, target_reps_snapshot, target_rest_seconds_snapshot
      FROM set_logs;
    `);
    await database.execAsync("DROP TABLE set_logs;");
    await database.execAsync("ALTER TABLE set_logs_new RENAME TO set_logs;");
    await database.execAsync("CREATE INDEX IF NOT EXISTS set_logs_session_idx ON set_logs(session_id);");
    await database.execAsync(
      "CREATE INDEX IF NOT EXISTS set_logs_workout_exercise_idx ON set_logs(workout_exercise_id);"
    );
  });
}

/**
 * Ensures workout_exercises.target_weight exists, regardless of what
 * schema_migrations claims. This is a plain nullable-column addition (no
 * existing NOT NULL constraint to relax), so unlike ensureNullableSetLogsWeight
 * it's a simple ALTER TABLE ADD COLUMN rather than a table rebuild. Checking the
 * live schema via PRAGMA table_info keeps it self-healing and idempotent,
 * consistent with ensureFavouriteColumn/ensureNullableSetLogsWeight above.
 */
export async function ensureWorkoutExerciseTargetWeight(database: DatabaseAdapter): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(workout_exercises);");
  const hasColumn = columns.some((column) => column.name === "target_weight");

  if (!hasColumn) {
    await database.execAsync(
      "ALTER TABLE workout_exercises ADD COLUMN target_weight REAL CHECK (target_weight IS NULL OR target_weight >= 0);"
    );
  }
}

/**
 * Ensures workout_exercise_set_plans exists and every workout_exercises row has
 * at least one plan row, regardless of what schema_migrations claims. Unlike the
 * other ensure* functions above, there's no existing column to check — a brand
 * new table is safe to CREATE TABLE IF NOT EXISTS on any device. What needs
 * self-healing is the *data*: workout_exercises rows created before per-set
 * plans existed (every pre-existing custom and sample workout) have zero plan
 * rows, so they're backfilled here with one row per target_sets, each carrying
 * the exercise's existing single reps/weight default — a "uniform" plan
 * equivalent to today's behavior, with no data loss and no forced re-entry.
 * The anti-join (LEFT JOIN ... WHERE plan.id IS NULL) makes this idempotent:
 * once a workout_exercise has any plan rows (backfilled or explicitly saved by
 * the builder), it's never touched again by this function.
 */
export async function ensureWorkoutExerciseSetPlans(database: DatabaseAdapter): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_exercise_set_plans (
      id TEXT PRIMARY KEY,
      workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL CHECK (set_number > 0),
      reps INTEGER NOT NULL CHECK (reps > 0),
      weight REAL CHECK (weight IS NULL OR weight >= 0),
      UNIQUE (workout_exercise_id, set_number)
    );
  `);
  await database.execAsync(
    "CREATE INDEX IF NOT EXISTS workout_exercise_set_plans_workout_exercise_idx ON workout_exercise_set_plans(workout_exercise_id);"
  );

  const unplanned = await database.getAllAsync<{
    id: string;
    targetSets: number;
    targetRepRangeLow: number;
    targetWeight: number | null;
  }>(`
    SELECT we.id as id,
           we.target_sets as targetSets,
           we.target_rep_range_low as targetRepRangeLow,
           we.target_weight as targetWeight
      FROM workout_exercises we
      LEFT JOIN workout_exercise_set_plans p ON p.workout_exercise_id = we.id
     WHERE p.id IS NULL
     GROUP BY we.id
  `);

  for (const exercise of unplanned) {
    for (let setNumber = 1; setNumber <= exercise.targetSets; setNumber += 1) {
      await database.runAsync(
        "INSERT INTO workout_exercise_set_plans (id, workout_exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?, ?)",
        [createLocalId("set_plan"), exercise.id, setNumber, exercise.targetRepRangeLow, exercise.targetWeight]
      );
    }
  }
}

/**
 * Ensures workout_sessions.rating exists, regardless of what schema_migrations
 * claims. Plain nullable-column addition (no existing NOT NULL constraint to
 * relax, no CHECK constraint — the 1-5 range is validated in application code,
 * not the DB, so a device with an out-of-range value already written some other
 * way still self-heals cleanly). Checking the live schema via PRAGMA table_info
 * keeps this self-healing and idempotent, consistent with the other ensure*
 * functions above.
 */
export async function ensureWorkoutSessionRating(database: DatabaseAdapter): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(workout_sessions);");
  const hasColumn = columns.some((column) => column.name === "rating");

  if (!hasColumn) {
    await database.execAsync("ALTER TABLE workout_sessions ADD COLUMN rating INTEGER;");
  }
}

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
      try {
        await database.execAsync(migration.sql);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (!/duplicate column name/i.test(message)) {
          throw error;
        }
      }

      await database.runAsync(
        "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
        [migration.id, new Date().toISOString()]
      );
    });
  }

  await ensureFavouriteColumn(database);
  await ensureNullableSetLogsWeight(database);
  await ensureWorkoutExerciseTargetWeight(database);
  await ensureWorkoutExerciseSetPlans(database);
  await ensureWorkoutSessionRating(database);
}
