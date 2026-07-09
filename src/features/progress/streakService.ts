import type { SupabaseClient } from "@supabase/supabase-js";

import { createSessionRepository } from "@/features/sessions/sessionRepository";
import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";

import { computeStreakDays } from "./streak";

const LOOKBACK_DAYS = 60;

export type StreakService = {
  getCurrentStreak(): Promise<number>;
};

export function createStreakService(client: SupabaseClient): StreakService {
  const sessionRepository = createSessionRepository(client);

  return {
    async getCurrentStreak() {
      const userId = await requireUserId(client);
      const sinceIso = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const sessions = await sessionRepository.listCompletedSessionsSince(userId, sinceIso);

      return computeStreakDays(
        sessions.map((session) => session.endedAt),
        new Date().toISOString()
      );
    }
  };
}

export const streakService: StreakService = createStreakService(supabase);
