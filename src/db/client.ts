import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

import * as schema from "./schema";

export const DATABASE_NAME = "trainingbuddy-v2.db";

export type SqlValue = string | number | null;
export type SqlParams = SqlValue[] | Record<string, SqlValue>;

export type DbRunResult = {
  changes?: number;
  lastInsertRowId?: number;
};

export type DatabaseAdapter = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlParams): Promise<DbRunResult>;
  getFirstAsync<T>(sql: string, params?: SqlParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SqlParams): Promise<T[]>;
  withTransactionAsync?<T>(task: () => Promise<T>): Promise<T>;
};

export type DrizzleDatabase = ExpoSQLiteDatabase<typeof schema>;

export type AppDatabaseClient = {
  sqlite: SQLite.SQLiteDatabase;
  db: DrizzleDatabase;
  adapter: DatabaseAdapter;
};

let singletonClient: Promise<AppDatabaseClient> | null = null;
let readyClient: Promise<AppDatabaseClient> | null = null;

export function createExpoDatabaseAdapter(sqlite: SQLite.SQLiteDatabase): DatabaseAdapter {
  return {
    execAsync(sql) {
      return sqlite.execAsync(sql);
    },
    runAsync(sql, params = []) {
      return sqlite.runAsync(sql, params);
    },
    getFirstAsync<T>(sql: string, params: SqlParams = []) {
      return sqlite.getFirstAsync<T>(sql, params);
    },
    getAllAsync<T>(sql: string, params: SqlParams = []) {
      return sqlite.getAllAsync<T>(sql, params);
    },
    async withTransactionAsync<T>(task: () => Promise<T>) {
      let result: T | undefined;

      await sqlite.withTransactionAsync(async () => {
        result = await task();
      });

      return result as T;
    }
  };
}

export async function openDatabaseClient(databaseName = DATABASE_NAME): Promise<AppDatabaseClient> {
  const sqlite = await SQLite.openDatabaseAsync(databaseName);

  await sqlite.execAsync("PRAGMA foreign_keys = ON;");

  return {
    sqlite,
    db: drizzle(sqlite, { schema }) as DrizzleDatabase,
    adapter: createExpoDatabaseAdapter(sqlite)
  };
}

export function getDatabaseClient(): Promise<AppDatabaseClient> {
  singletonClient ??= openDatabaseClient();

  return singletonClient;
}

/**
 * Returns the database client after migrations and seed data have been applied.
 * Memoized so concurrent callers (e.g. multiple screens mounting at once) share a
 * single migration/seed run instead of racing separate transactions on the same
 * underlying SQLite connection.
 */
export function getReadyDatabaseClient(): Promise<AppDatabaseClient> {
  readyClient ??= (async () => {
    try {
      const client = await getDatabaseClient();
      const [{ runMigrations }, { loadSeedData }] = await Promise.all([
        import("./migrate"),
        import("./seed/loadSeedData")
      ]);

      await runMigrations(client.adapter);
      await loadSeedData(client.adapter);

      return client;
    } catch (error) {
      // Allow a later call to retry instead of permanently caching a rejected promise.
      readyClient = null;
      throw error;
    }
  })();

  return readyClient;
}

export function resetDatabaseClientForTests(): void {
  singletonClient = null;
  readyClient = null;
}
