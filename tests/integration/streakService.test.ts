import { DatabaseSync } from "node:sqlite";

import { migrations, runMigrations } from "../../src/db/migrate";
import { createSessionRepository } from "../../src/db/repositories/sessionRepository";
import { createStreakServiceForDatabase } from "../../src/features/progress/streakService";
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

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function setUpDatabase(): Promise<DatabaseAdapter> {
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

  return adapter;
}

async function seedCompletedSession(
  adapter: DatabaseAdapter,
  daysAgo: number
): Promise<void> {
  const repository = createSessionRepository(adapter);
  const session = await repository.startSession({
    workoutId: "w1",
    userId: "u1",
    workoutNameSnapshot: "Test Workout",
    startedAt: daysAgoIso(daysAgo)
  });

  await repository.completeSession(session.id, { endedAt: daysAgoIso(daysAgo) });
}

async function seedDiscardedSession(adapter: DatabaseAdapter, daysAgo: number): Promise<void> {
  const repository = createSessionRepository(adapter);
  const session = await repository.startSession({
    workoutId: "w1",
    userId: "u1",
    workoutNameSnapshot: "Test Workout",
    startedAt: daysAgoIso(daysAgo)
  });

  await repository.updateSessionStatus(session.id, "discarded", daysAgoIso(daysAgo));
}

describe("streakService", () => {
  it("returns 0 when there are no completed sessions", async () => {
    const adapter = await setUpDatabase();
    const streakService = createStreakServiceForDatabase(adapter);

    expect(await streakService.getCurrentStreak("u1")).toBe(0);
  });

  it("counts consecutive days of completed sessions ending today", async () => {
    const adapter = await setUpDatabase();

    await seedCompletedSession(adapter, 0);
    await seedCompletedSession(adapter, 1);
    await seedCompletedSession(adapter, 2);

    const streakService = createStreakServiceForDatabase(adapter);
    expect(await streakService.getCurrentStreak("u1")).toBe(3);
  });

  it("excludes discarded and still-active sessions from the streak", async () => {
    const adapter = await setUpDatabase();

    await seedCompletedSession(adapter, 0);
    await seedDiscardedSession(adapter, 1);

    const repository = createSessionRepository(adapter);
    await repository.startSession({
      workoutId: "w1",
      userId: "u1",
      workoutNameSnapshot: "Test Workout",
      startedAt: daysAgoIso(2)
    });

    const streakService = createStreakServiceForDatabase(adapter);
    expect(await streakService.getCurrentStreak("u1")).toBe(1);
  });

  it("resets after a gap in completed sessions", async () => {
    const adapter = await setUpDatabase();

    await seedCompletedSession(adapter, 0);
    // gap: no session yesterday (daysAgo 1)
    await seedCompletedSession(adapter, 2);

    const streakService = createStreakServiceForDatabase(adapter);
    expect(await streakService.getCurrentStreak("u1")).toBe(1);
  });
});
