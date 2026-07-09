import type { DatabaseAdapter } from "@/db/client";
import { createSessionRepository, type CompletedSessionSummary } from "@/db/repositories/sessionRepository";

const LOCAL_USER_ID = "local-user";

export type { CompletedSessionSummary };

export type HistoryService = {
  listCompletedSessions(userId?: string, limit?: number): Promise<CompletedSessionSummary[]>;
};

export function createHistoryService(
  sessionRepository: ReturnType<typeof createSessionRepository>
): HistoryService {
  return {
    listCompletedSessions(userId = LOCAL_USER_ID, limit = 50) {
      return sessionRepository.listCompletedSessions(userId, limit);
    }
  };
}

export function createHistoryServiceForDatabase(database: DatabaseAdapter): HistoryService {
  return createHistoryService(createSessionRepository(database));
}

async function createRuntimeHistoryService(): Promise<HistoryService> {
  const { getReadyDatabaseClient } = await import("@/db/client");
  const { adapter } = await getReadyDatabaseClient();

  return createHistoryServiceForDatabase(adapter);
}

export const historyService: HistoryService = {
  async listCompletedSessions(userId, limit) {
    return (await createRuntimeHistoryService()).listCompletedSessions(userId, limit);
  }
};
