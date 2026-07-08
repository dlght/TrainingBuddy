import { DatabaseSync } from "node:sqlite";

import { migrations, runMigrations } from "../../src/db/migrate";
import { createWorkoutRepository } from "../../src/db/repositories/workoutRepository";
import { createWorkoutRecommendationService } from "../../src/features/workouts/workoutRecommendationService";
import type { DatabaseAdapter, SqlParams } from "../../src/db/client";

function toArgs(params: SqlParams = []): unknown[] {
  return Array.isArray(params) ? params : Object.values(params);
}

/**
 * Uses a real SQLite engine rather than the hand-rolled TestDatabase mock:
 * that mock's getAllAsync doesn't filter `WHERE is_favourite = 1` or support
 * the JOIN/GROUP BY query behind getTopWorkouts, so it can't faithfully
 * exercise this service's actual SQL.
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

async function completeSession(adapter: DatabaseAdapter, id: string, workoutId: string, endedAt: string): Promise<void> {
  await adapter.runAsync(
    `INSERT INTO workout_sessions (id, workout_id, user_id, started_at, ended_at, status, workout_name_snapshot)
     VALUES (?, ?, 'u1', ?, ?, 'completed', 'snapshot')`,
    [id, workoutId, endedAt, endedAt]
  );
}

describe("workoutRecommendationService.getSuggestedWorkouts", () => {
  it("prioritizes favourited workouts over top-completed ones, filling remaining slots", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedUserAndMuscleGroup(adapter);

    const repo = createWorkoutRepository(adapter);
    const favA = await repo.createWorkout({ name: "Favourite A", userId: "u1" });
    const favB = await repo.createWorkout({ name: "Favourite B", userId: "u1" });
    const topC = await repo.createWorkout({ name: "Most Completed C", userId: "u1" });
    const topD = await repo.createWorkout({ name: "Second Completed D", userId: "u1" });

    await repo.toggleFavourite(favA.id);
    await repo.toggleFavourite(favB.id);

    // C has the most completions, D has fewer — neither is a favourite.
    await completeSession(adapter, "s1", topC.id, "2026-01-01T00:00:00.000Z");
    await completeSession(adapter, "s2", topC.id, "2026-01-02T00:00:00.000Z");
    await completeSession(adapter, "s3", topC.id, "2026-01-03T00:00:00.000Z");
    await completeSession(adapter, "s4", topD.id, "2026-01-04T00:00:00.000Z");

    const service = createWorkoutRecommendationService(adapter);
    const suggested = await service.getSuggestedWorkouts();

    expect(suggested).toHaveLength(3);
    expect(suggested.filter((workout) => workout.isFavourite).map((workout) => workout.id)).toEqual(
      expect.arrayContaining([favA.id, favB.id])
    );
    // The one non-favourite slot goes to the most-completed workout, not D.
    expect(suggested.map((workout) => workout.id)).toContain(topC.id);
    expect(suggested.map((workout) => workout.id)).not.toContain(topD.id);
  });

  it("falls back to existing top-completed/seeded behavior when there are no favourites", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedUserAndMuscleGroup(adapter);

    const repo = createWorkoutRepository(adapter);
    const workout = await repo.createWorkout({ name: "Only Workout", userId: "u1" });
    await completeSession(adapter, "s1", workout.id, "2026-01-01T00:00:00.000Z");

    const service = createWorkoutRecommendationService(adapter);
    const suggested = await service.getSuggestedWorkouts();

    expect(suggested.some((entry) => entry.id === workout.id && !entry.isFavourite)).toBe(true);
  });

  it("removes an un-favourited workout from the suggestions on the next call", async () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const adapter = makeRealAdapter(db);
    await runMigrations(adapter, migrations);
    await seedUserAndMuscleGroup(adapter);

    const repo = createWorkoutRepository(adapter);
    const fav = await repo.createWorkout({ name: "Temporarily Favourited", userId: "u1" });
    await repo.toggleFavourite(fav.id);

    const service = createWorkoutRecommendationService(adapter);
    const withFavourite = await service.getSuggestedWorkouts();
    expect(withFavourite.map((entry) => entry.id)).toContain(fav.id);

    await repo.toggleFavourite(fav.id);

    const withoutFavourite = await service.getSuggestedWorkouts();
    expect(withoutFavourite.find((entry) => entry.id === fav.id)?.isFavourite).not.toBe(true);
  });
});
