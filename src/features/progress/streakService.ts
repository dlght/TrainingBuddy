import type { DatabaseAdapter } from "@/db/client";
import { createSessionRepository } from "@/db/repositories/sessionRepository";

import { computeStreakDays } from "./streak";

const LOCAL_USER_ID = "local-user";
const LOOKBACK_DAYS = 60;

export type StreakService = {
  getCurrentStreak(userId?: string): Promise<number>;
};

export function createStreakService(
  sessionRepository: ReturnType<typeof createSessionRepository>
): StreakService {
  return {
    async getCurrentStreak(userId = LOCAL_USER_ID) {
      const sinceIso = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const sessions = await sessionRepository.listCompletedSessionsSince(userId, sinceIso);

      return computeStreakDays(
        sessions.map((session) => session.endedAt),
        new Date().toISOString()
      );
    }
  };
}

export function createStreakServiceForDatabase(database: DatabaseAdapter): StreakService {
  return createStreakService(createSessionRepository(database));
}

async function createRuntimeStreakService(): Promise<StreakService> {
  const { getReadyDatabaseClient } = await import("@/db/client");
  const { adapter } = await getReadyDatabaseClient();

  return createStreakServiceForDatabase(adapter);
}

export const streakService: StreakService = {
  async getCurrentStreak(userId) {
    return (await createRuntimeStreakService()).getCurrentStreak(userId);
  }
};
