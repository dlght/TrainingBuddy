import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateSetLogInput, SetLog, WorkoutSession, WorkoutSessionStatus } from "@/models/session";
import { createLocalId } from "@/utils/ids";

export type StartSessionInput = {
  workoutId: string;
  userId: string;
  workoutNameSnapshot: string;
  startedAt?: string;
};

export type CompletedSessionSummary = {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  endedAt: string;
  totalSets: number;
  totalVolume: number;
  rating: number | null;
};

type SessionRow = {
  id: string;
  workout_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  status: WorkoutSessionStatus;
  workout_name_snapshot: string;
  rating: number | null;
  paused_at: string | null;
};

type SetLogRow = {
  id: string;
  session_id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number | null;
  completed_at: string;
  exercise_name_snapshot: string;
  target_reps_snapshot: string | null;
  target_rest_seconds_snapshot: number | null;
};

function toSession(row: SessionRow): WorkoutSession {
  return {
    id: row.id,
    workoutId: row.workout_id,
    userId: row.user_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status,
    workoutNameSnapshot: row.workout_name_snapshot,
    rating: row.rating,
    pausedAt: row.paused_at
  };
}

function toSetLog(row: SetLogRow): SetLog {
  return {
    id: row.id,
    sessionId: row.session_id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: row.set_number,
    reps: row.reps,
    weight: row.weight,
    completedAt: row.completed_at,
    exerciseNameSnapshot: row.exercise_name_snapshot,
    targetRepsSnapshot: row.target_reps_snapshot,
    targetRestSecondsSnapshot: row.target_rest_seconds_snapshot
  };
}

function summarizeCompletedSessions(
  sessions: SessionRow[],
  setLogsBySession: Map<string, SetLogRow[]>
): CompletedSessionSummary[] {
  return sessions.map((session) => {
    const setLogs = setLogsBySession.get(session.id) ?? [];

    return {
      id: session.id,
      workoutId: session.workout_id,
      workoutName: session.workout_name_snapshot,
      startedAt: session.started_at,
      endedAt: session.ended_at as string,
      rating: session.rating,
      totalSets: setLogs.length,
      totalVolume: setLogs.reduce((sum, setLog) => sum + setLog.reps * (setLog.weight ?? 0), 0)
    };
  });
}

export function createSessionRepository(client: SupabaseClient) {
  async function getSessionById(sessionId: string): Promise<WorkoutSession | null> {
    const { data, error } = await client.from("workout_sessions").select("*").eq("id", sessionId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? toSession(data as SessionRow) : null;
  }

  async function getActiveSession(userId: string): Promise<WorkoutSession | null> {
    const { data, error } = await client
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? toSession(data as SessionRow) : null;
  }

  async function listSetLogs(sessionId: string): Promise<SetLog[]> {
    const { data, error } = await client
      .from("set_logs")
      .select("*")
      .eq("session_id", sessionId)
      .order("completed_at")
      .order("set_number");

    if (error) {
      throw error;
    }

    return ((data ?? []) as SetLogRow[]).map(toSetLog);
  }

  async function listCompletedSessionRowsSince(userId: string, sinceIso: string): Promise<SessionRow[]> {
    const { data, error } = await client
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("ended_at", sinceIso)
      .order("ended_at");

    if (error) {
      throw error;
    }

    return (data ?? []) as SessionRow[];
  }

  async function listSetLogsForSessions(sessionIds: string[]): Promise<Map<string, SetLogRow[]>> {
    const byId = new Map<string, SetLogRow[]>();

    if (sessionIds.length === 0) {
      return byId;
    }

    const { data, error } = await client.from("set_logs").select("*").in("session_id", sessionIds);

    if (error) {
      throw error;
    }

    for (const row of (data ?? []) as SetLogRow[]) {
      const existing = byId.get(row.session_id) ?? [];
      existing.push(row);
      byId.set(row.session_id, existing);
    }

    return byId;
  }

  return {
    getSessionById,
    getActiveSession,
    listSetLogs,

    async startSession(input: StartSessionInput): Promise<WorkoutSession> {
      const existing = await getActiveSession(input.userId);

      if (existing) {
        throw new Error("An active workout session already exists.");
      }

      const session: WorkoutSession = {
        id: createLocalId("session"),
        workoutId: input.workoutId,
        userId: input.userId,
        startedAt: input.startedAt ?? new Date().toISOString(),
        endedAt: null,
        status: "active",
        workoutNameSnapshot: input.workoutNameSnapshot,
        rating: null,
        pausedAt: null
      };

      const { error } = await client.from("workout_sessions").insert({
        id: session.id,
        workout_id: session.workoutId,
        user_id: session.userId,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        status: session.status,
        workout_name_snapshot: session.workoutNameSnapshot,
        rating: session.rating,
        paused_at: session.pausedAt
      });

      if (error) {
        throw error;
      }

      return session;
    },

    async updateSessionStatus(
      sessionId: string,
      status: Extract<WorkoutSessionStatus, "completed" | "discarded">,
      endedAt = new Date().toISOString()
    ): Promise<void> {
      const { error } = await client
        .from("workout_sessions")
        .update({ status, ended_at: endedAt })
        .eq("id", sessionId)
        .in("status", ["active", "paused"]);

      if (error) {
        throw error;
      }
    },

    async pauseSession(sessionId: string): Promise<void> {
      const { error } = await client
        .from("workout_sessions")
        .update({ status: "paused", paused_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("status", "active");

      if (error) {
        throw error;
      }
    },

    async resumeSession(sessionId: string): Promise<void> {
      const session = await getSessionById(sessionId);

      if (!session || session.status !== "paused" || !session.pausedAt) {
        return;
      }

      const pauseDurationMs = Date.now() - new Date(session.pausedAt).getTime();
      const shiftedStartedAt = new Date(new Date(session.startedAt).getTime() + Math.max(0, pauseDurationMs)).toISOString();

      const { error } = await client
        .from("workout_sessions")
        .update({ status: "active", paused_at: null, started_at: shiftedStartedAt })
        .eq("id", sessionId)
        .eq("status", "paused");

      if (error) {
        throw error;
      }
    },

    async completeSession(
      sessionId: string,
      options: { rating?: number | null; endedAt?: string } = {}
    ): Promise<void> {
      const endedAt = options.endedAt ?? new Date().toISOString();
      const rating = options.rating ?? null;

      const { error } = await client
        .from("workout_sessions")
        .update({ status: "completed", ended_at: endedAt, rating })
        .eq("id", sessionId)
        .eq("status", "active");

      if (error) {
        throw error;
      }
    },

    async addSetLog(input: CreateSetLogInput): Promise<SetLog> {
      const setLog: SetLog = {
        ...input,
        id: input.id ?? createLocalId("set"),
        completedAt: input.completedAt ?? new Date().toISOString()
      };

      const { error } = await client.from("set_logs").insert({
        id: setLog.id,
        session_id: setLog.sessionId,
        workout_exercise_id: setLog.workoutExerciseId,
        set_number: setLog.setNumber,
        reps: setLog.reps,
        weight: setLog.weight,
        completed_at: setLog.completedAt,
        exercise_name_snapshot: setLog.exerciseNameSnapshot,
        target_reps_snapshot: setLog.targetRepsSnapshot,
        target_rest_seconds_snapshot: setLog.targetRestSecondsSnapshot
      });

      if (error) {
        throw error;
      }

      return setLog;
    },

    async listCompletedSessionsSince(userId: string, sinceIso: string): Promise<{ id: string; endedAt: string }[]> {
      const sessions = await listCompletedSessionRowsSince(userId, sinceIso);

      return sessions.map((session) => ({ id: session.id, endedAt: session.ended_at as string }));
    },

    async listAllCompletedSessionEndTimes(userId: string): Promise<string[]> {
      const { data, error } = await client
        .from("workout_sessions")
        .select("ended_at")
        .eq("user_id", userId)
        .eq("status", "completed");

      if (error) {
        throw error;
      }

      return ((data ?? []) as { ended_at: string }[]).map((row) => row.ended_at);
    },

    async listCompletedSetLogsSince(
      userId: string,
      sinceIso: string
    ): Promise<{ completedAt: string; reps: number; weight: number | null }[]> {
      const sessions = await listCompletedSessionRowsSince(userId, sinceIso);
      const setLogsBySession = await listSetLogsForSessions(sessions.map((session) => session.id));
      const setLogs = Array.from(setLogsBySession.values()).flat();

      return setLogs
        .filter((setLog) => setLog.completed_at >= sinceIso)
        .sort((a, b) => a.completed_at.localeCompare(b.completed_at))
        .map((setLog) => ({ completedAt: setLog.completed_at, reps: setLog.reps, weight: setLog.weight }));
    },

    async listCompletedSessions(userId: string, limit = 50): Promise<CompletedSessionSummary[]> {
      const { data, error } = await client
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("ended_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      const sessions = (data ?? []) as SessionRow[];
      const setLogsBySession = await listSetLogsForSessions(sessions.map((session) => session.id));

      return summarizeCompletedSessions(sessions, setLogsBySession);
    },

    async listCompletedSessionsInRange(
      userId: string,
      startIso: string,
      endIsoExclusive: string
    ): Promise<CompletedSessionSummary[]> {
      const { data, error } = await client
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("ended_at", startIso)
        .lt("ended_at", endIsoExclusive)
        .order("ended_at", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        throw error;
      }

      const sessions = (data ?? []) as SessionRow[];
      const setLogsBySession = await listSetLogsForSessions(sessions.map((session) => session.id));

      return summarizeCompletedSessions(sessions, setLogsBySession);
    }
  };
}
