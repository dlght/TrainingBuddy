import type { DatabaseAdapter } from "../client";

export const CURRENT_SEED_VERSION = "2026-07-08-fullbody-v2";

export type SeedVersion = {
  id: string;
  appliedAt: string;
};

export async function ensureSeedVersionTable(database: DatabaseAdapter): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS seed_versions (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

export async function getSeedVersion(
  database: DatabaseAdapter,
  versionId = CURRENT_SEED_VERSION
): Promise<SeedVersion | null> {
  await ensureSeedVersionTable(database);

  return database.getFirstAsync<SeedVersion>(
    "SELECT id, applied_at as appliedAt FROM seed_versions WHERE id = ? LIMIT 1",
    [versionId]
  );
}

export async function hasSeedVersion(
  database: DatabaseAdapter,
  versionId = CURRENT_SEED_VERSION
): Promise<boolean> {
  return (await getSeedVersion(database, versionId)) !== null;
}

export async function markSeedVersionApplied(
  database: DatabaseAdapter,
  versionId = CURRENT_SEED_VERSION,
  appliedAt = new Date().toISOString()
): Promise<void> {
  await ensureSeedVersionTable(database);
  await database.runAsync(
    "INSERT OR REPLACE INTO seed_versions (id, applied_at) VALUES (?, ?)",
    [versionId, appliedAt]
  );
}
