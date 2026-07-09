import type { SupabaseClient } from "@supabase/supabase-js";

import { createSessionRepository } from "@/features/sessions/sessionRepository";
import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";

import { calculateWeeklyDashboardStats, type WeeklyDashboardStats } from "./dashboardStats";

const DASHBOARD_WINDOW_DAYS = 6;

export type DashboardService = {
  getWeeklyDashboardStats(): Promise<WeeklyDashboardStats>;
};

export function createDashboardService(client: SupabaseClient): DashboardService {
  const sessionRepository = createSessionRepository(client);

  return {
    async getWeeklyDashboardStats() {
      const userId = await requireUserId(client);
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

export const dashboardService: DashboardService = createDashboardService(supabase);
