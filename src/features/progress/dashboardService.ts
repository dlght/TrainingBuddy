import type { DatabaseAdapter } from "@/db/client";
import { createSessionRepository } from "@/db/repositories/sessionRepository";

import { calculateWeeklyDashboardStats, type WeeklyDashboardStats } from "./dashboardStats";

const LOCAL_USER_ID = "local-user";
const DASHBOARD_WINDOW_DAYS = 6;

export type SessionRepository = ReturnType<typeof createSessionRepository>;

export type DashboardService = {
  getWeeklyDashboardStats(userId?: string): Promise<WeeklyDashboardStats>;
};

export function createDashboardService(sessionRepository: SessionRepository): DashboardService {
  return {
    async getWeeklyDashboardStats(userId = LOCAL_USER_ID) {
      const referenceDate = new Date();
      const sinceDate = new Date(referenceDate);
      sinceDate.setDate(sinceDate.getDate() - (DASHBOARD_WINDOW_DAYS - 1));
      sinceDate.setHours(0, 0, 0, 0);
      const sinceIso = sinceDate.toISOString();

      const [completedSessions, setLogs] = await Promise.all([
        sessionRepository.listCompletedSessionsSince(userId, sinceIso),
        sessionRepository.listCompletedSetLogsSince(userId, sinceIso)
      ]);

      return calculateWeeklyDashboardStats(
        setLogs,
        completedSessions.map((session) => session.endedAt),
        referenceDate,
        DASHBOARD_WINDOW_DAYS
      );
    }
  };
}

export function createDashboardServiceForDatabase(database: DatabaseAdapter): DashboardService {
  return createDashboardService(createSessionRepository(database));
}

async function createRuntimeDashboardService(): Promise<DashboardService> {
  const { getReadyDatabaseClient } = await import("@/db/client");
  const { adapter } = await getReadyDatabaseClient();

  return createDashboardServiceForDatabase(adapter);
}

export const dashboardService: DashboardService = {
  async getWeeklyDashboardStats(userId) {
    return (await createRuntimeDashboardService()).getWeeklyDashboardStats(userId);
  }
};
