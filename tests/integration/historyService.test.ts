import { DatabaseSync } from "node:sqlite";

import { migrations, runMigrations } from "../../src/db/migrate";
import { createHistoryServiceForDatabase } from "../../src/features/progress/historyService";
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
  await adapter.runAsync(
    `INSERT INTO workouts (id, name, user_id, created_at, is_template, source_template_id)
     VALUES ('w1', 'Leg Day', 'u1', '2026-01-01T00:00:00.000Z', 0, NULL)`
  );
  await adapter.runAsync(
    `INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, target_sets, target_rep_range_low, target_rep_range_high, target_rest_seconds, superset_group_id)
     VALUES ('we1', 'w1', 'squat', 0, 3, 10, 10, 60, NULL)`
  );
}

describe("historyService.listCompletedSessions", () => {
  it("lists completed sessions most-recent-first with set count and volume, excluding active/discarded sessions", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedFixture(adapter);

    await adapter.runAsync(
      `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
       VALUES ('s1', 'w1', 'u1', '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', 'completed', 'Leg Day')`
    );
    await adapter.runAsync(
      `INSERT INTO set_logs (id, session_id, workout_exercise_id, set_number, reps, weight, completed_at, exercise_name_snapshot)
       VALUES ('set1', 's1', 'we1', 1, 10, 40, '2026-01-01T00:10:00.000Z', 'Squat'),
              ('set2', 's1', 'we1', 2, 10, 40, '2026-01-01T00:20:00.000Z', 'Squat')`
    );

    await adapter.runAsync(
      `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
       VALUES ('s2', 'w1', 'u1', '2026-01-02T00:00:00.000Z', '2026-01-02T01:00:00.000Z', 'completed', 'Leg Day')`
    );

    // Active and discarded sessions must not appear in history.
    await adapter.runAsync(
      `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
       VALUES ('s3', 'w1', 'u1', '2026-01-03T00:00:00.000Z', NULL, 'active', 'Leg Day')`
    );
    await adapter.runAsync(
      `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
       VALUES ('s4', 'w1', 'u1', '2026-01-04T00:00:00.000Z', '2026-01-04T00:05:00.000Z', 'discarded', 'Leg Day')`
    );

    const service = createHistoryServiceForDatabase(adapter);
    const sessions = await service.listCompletedSessions("u1");

    expect(sessions.map((session) => session.id)).toEqual(["s2", "s1"]);

    const first = sessions.find((session) => session.id === "s1");
    expect(first).toMatchObject({
      workoutId: "w1",
      workoutName: "Leg Day",
      totalSets: 2,
      totalVolume: 800
    });

    const second = sessions.find((session) => session.id === "s2");
    expect(second).toMatchObject({ totalSets: 0, totalVolume: 0 });
  });

  it("returns an empty list when there are no completed sessions", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedFixture(adapter);

    const service = createHistoryServiceForDatabase(adapter);
    const sessions = await service.listCompletedSessions("u1");

    expect(sessions).toEqual([]);
  });
});
