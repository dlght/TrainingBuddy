import type { SupabaseClient } from "@supabase/supabase-js";

import { createSessionRepository, type CompletedSessionSummary } from "@/features/sessions/sessionRepository";
import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";
import type { SetLog } from "@/models/session";

export type { CompletedSessionSummary };

export type HistoryService = {
  listCompletedSessions(limit?: number): Promise<CompletedSessionSummary[]>;
  listCompletedSessionsInRange(startIso: string, endIsoExclusive: string): Promise<CompletedSessionSummary[]>;
  listSetLogsForSession(sessionId: string): Promise<SetLog[]>;
};

export function createHistoryService(client: SupabaseClient): HistoryService {
  const sessionRepository = createSessionRepository(client);

  return {
    async listCompletedSessions(limit = 50) {
      const userId = await requireUserId(client);

      return sessionRepository.listCompletedSessions(userId, limit);
    },

    async listCompletedSessionsInRange(startIso, endIsoExclusive) {
      const userId = await requireUserId(client);

      return sessionRepository.listCompletedSessionsInRange(userId, startIso, endIsoExclusive);
    },

    listSetLogsForSession(sessionId) {
      return sessionRepository.listSetLogs(sessionId);
    }
  };
}

export const historyService: HistoryService = createHistoryService(supabase);
