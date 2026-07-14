import type { SupabaseClient } from "@supabase/supabase-js";

import { createProfileService } from "@/features/profile/profileService";
import { computeLongestStreakDays } from "@/features/progress/streak";
import { createPersonalRecordRepository } from "@/features/sessions/personalRecordRepository";
import { createSessionRepository } from "@/features/sessions/sessionRepository";
import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";

import type { Badge, BadgeCategory, BadgeProgress } from "./badge";
import { isRatioBadgeAchieved } from "./bodyweightRatio";
import { computeBestMonthlyWorkoutCount } from "./monthlyWorkoutCount";
import { countDistinctSessionsForExercise, sumLifetimeVolumeKg, type CompletedSetLogWithExercise } from "./setLogMetrics";

type BadgeRow = {
  id: string;
  category: BadgeCategory;
  threshold: number;
  label: string;
  exercise_id: string | null;
  ratio_multiplier: number | null;
};

export type ChallengeProgress = {
  lifetimeWorkoutCount: number;
  longestStreakDays: number;
  bodyweight: number | null;
  badges: BadgeProgress[];
};

export type ChallengesService = {
  getProgress(): Promise<ChallengeProgress>;
};

function toBadge(row: BadgeRow): Badge {
  return {
    id: row.id,
    category: row.category,
    threshold: row.threshold,
    label: row.label,
    exerciseId: row.exercise_id,
    ratioMultiplier: row.ratio_multiplier
  };
}

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

type ProgressContext = {
  lifetimeWorkoutCount: number;
  longestStreakDays: number;
  bestMonthlyWorkoutCount: number;
  lifetimeVolumeKg: number;
  setLogsWithExercise: CompletedSetLogWithExercise[];
  personalRecordCount: number;
  bestWeightByExercise: Map<string, number>;
  bodyweight: number | null;
};

function toBadgeProgress(badge: Badge, context: ProgressContext): BadgeProgress {
  if (badge.category === "bodyweight_ratio") {
    const bestWeight = badge.exerciseId ? context.bestWeightByExercise.get(badge.exerciseId) : undefined;
    const achieved =
      badge.ratioMultiplier !== null
        ? isRatioBadgeAchieved(context.bodyweight, bestWeight, badge.ratioMultiplier)
        : false;

    return { ...badge, achieved };
  }

  const value = (() => {
    switch (badge.category) {
      case "lifetime_workouts":
        return context.lifetimeWorkoutCount;
      case "streak":
        return context.longestStreakDays;
      case "monthly_workout_count":
        return context.bestMonthlyWorkoutCount;
      case "total_volume_kg":
        return context.lifetimeVolumeKg;
      case "exercise_session_count":
        return badge.exerciseId
          ? countDistinctSessionsForExercise(context.setLogsWithExercise, badge.exerciseId)
          : 0;
      case "pr_count":
        return context.personalRecordCount;
      default:
        return 0;
    }
  })();

  return { ...badge, achieved: value >= badge.threshold };
}

export function createChallengesService(client: SupabaseClient): ChallengesService {
  const sessionRepository = createSessionRepository(client);
  const personalRecordRepository = createPersonalRecordRepository(client);
  const profileService = createProfileService(client);

  return {
    async getProgress() {
      const userId = await requireUserId(client);

      const [{ data: badgeRows, error: badgeError }, endedAtList, setLogsWithExercise, personalRecords, profile] =
        await Promise.all([
          client.from("badges").select("*").order("category").order("threshold"),
          sessionRepository.listAllCompletedSessionEndTimes(userId),
          sessionRepository.listAllCompletedSetLogsWithExercise(userId),
          personalRecordRepository.listPersonalRecords(userId),
          profileService.getProfile()
        ]);

      if (badgeError) {
        throw badgeError;
      }

      const bestWeightByExercise = new Map<string, number>();

      for (const record of personalRecords) {
        const current = bestWeightByExercise.get(record.exerciseId);

        if (current === undefined || record.weight > current) {
          bestWeightByExercise.set(record.exerciseId, record.weight);
        }
      }

      // lifetime_workouts, streak (longest-ever), monthly_workout_count
      // (best-ever month), total_volume_kg, and pr_count are all
      // monotonically non-decreasing over an account's lifetime, so
      // achievement can always be computed fresh from full history — there
      // is nothing to backfill and nothing to un-achieve. bodyweight_ratio
      // is the one exception (see plan.md Design Decision 6): it's
      // recomputed against whatever bodyweight is on file right now.
      const context: ProgressContext = {
        lifetimeWorkoutCount: endedAtList.length,
        longestStreakDays: computeLongestStreakDays(endedAtList),
        bestMonthlyWorkoutCount: computeBestMonthlyWorkoutCount(endedAtList),
        lifetimeVolumeKg: sumLifetimeVolumeKg(setLogsWithExercise),
        setLogsWithExercise,
        personalRecordCount: personalRecords.length,
        bestWeightByExercise,
        bodyweight: profile?.bodyweight ?? null
      };

      const badges = ((badgeRows ?? []) as BadgeRow[])
        .map(toBadge)
        .map((badge) => toBadgeProgress(badge, context));

      return {
        lifetimeWorkoutCount: context.lifetimeWorkoutCount,
        longestStreakDays: context.longestStreakDays,
        bodyweight: context.bodyweight,
        badges: sortBadges(badges)
      };
    }
  };
}

export const challengesService: ChallengesService = createChallengesService(supabase);
