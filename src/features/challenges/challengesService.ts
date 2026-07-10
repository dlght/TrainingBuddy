import type { SupabaseClient } from "@supabase/supabase-js";

import { computeLongestStreakDays } from "@/features/progress/streak";
import { createSessionRepository } from "@/features/sessions/sessionRepository";
import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";

import type { Badge, BadgeCategory, BadgeProgress } from "./badge";

type BadgeRow = {
  id: string;
  category: BadgeCategory;
  threshold: number;
  label: string;
};

export type ChallengeProgress = {
  lifetimeWorkoutCount: number;
  longestStreakDays: number;
  badges: BadgeProgress[];
};

export type ChallengesService = {
  getProgress(): Promise<ChallengeProgress>;
};

/**
 * Achieved badges first, then by threshold ascending within each group —
 * so a locked track still reads as "next milestone first" rather than
 * shuffled.
 */
function sortBadges(badges: BadgeProgress[]): BadgeProgress[] {
  return badges.slice().sort((a, b) => {
    if (a.achieved !== b.achieved) {
      return a.achieved ? -1 : 1;
    }

    return a.threshold - b.threshold;
  });
}

function toBadgeProgress(badge: Badge, lifetimeWorkoutCount: number, longestStreakDays: number): BadgeProgress {
  const value = badge.category === "lifetime_workouts" ? lifetimeWorkoutCount : longestStreakDays;

  return { ...badge, achieved: value >= badge.threshold };
}

export function createChallengesService(client: SupabaseClient): ChallengesService {
  const sessionRepository = createSessionRepository(client);

  return {
    async getProgress() {
      const userId = await requireUserId(client);

      const [{ data: badgeRows, error: badgeError }, endedAtList] = await Promise.all([
        client.from("badges").select("*").order("category").order("threshold"),
        sessionRepository.listAllCompletedSessionEndTimes(userId)
      ]);

      if (badgeError) {
        throw badgeError;
      }

      // Both values are monotonically non-decreasing over an account's
      // lifetime, so achievement can always be computed fresh from full
      // history — there is nothing to backfill and nothing to un-achieve.
      const lifetimeWorkoutCount = endedAtList.length;
      const longestStreakDays = computeLongestStreakDays(endedAtList);

      const badges = ((badgeRows ?? []) as BadgeRow[]).map((row) =>
        toBadgeProgress(row, lifetimeWorkoutCount, longestStreakDays)
      );

      return {
        lifetimeWorkoutCount,
        longestStreakDays,
        badges: sortBadges(badges)
      };
    }
  };
}

export const challengesService: ChallengesService = createChallengesService(supabase);
