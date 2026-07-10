import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import type { BadgeCategory, BadgeProgress } from "@/features/challenges/badge";
import { challengesService, type ChallengeProgress } from "@/features/challenges/challengesService";

function BadgeCard({ badge }: { badge: BadgeProgress }) {
  return (
    <View style={[styles.badgeCard, badge.achieved ? styles.badgeCardAchieved : styles.badgeCardLocked]}>
      <Text style={styles.badgeIcon}>{badge.achieved ? "🏆" : "🔒"}</Text>
      <Text style={[styles.badgeLabel, badge.achieved ? null : styles.badgeLabelLocked]}>{badge.label}</Text>
    </View>
  );
}

function BadgeSection({ title, badges }: { title: string; badges: BadgeProgress[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.badgeGrid}>
        {badges.map((badge) => (
          <BadgeCard badge={badge} key={badge.id} />
        ))}
      </View>
    </View>
  );
}

function badgesFor(progress: ChallengeProgress, category: BadgeCategory): BadgeProgress[] {
  return progress.badges.filter((badge) => badge.category === category);
}

export default function ChallengesScreen() {
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      challengesService
        .getProgress()
        .then((loaded) => {
          if (mounted) {
            setProgress(loaded);
            setError(null);
          }
        })
        .catch((loadError) => {
          console.error("Challenges could not be loaded.", loadError);

          if (mounted) {
            setError("Challenges could not be loaded.");
          }
        })
        .finally(() => {
          if (mounted) {
            setIsLoading(false);
          }
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Challenges</Text>
        <Text style={styles.title}>Badges</Text>
        <Text style={styles.body}>Earn badges by logging workouts and building streaks.</Text>
      </View>

      {isLoading ? <LoadingState inline message="Loading challenges" /> : null}
      {error ? <ErrorState message={error} title="Challenges" /> : null}

      {progress ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{progress.lifetimeWorkoutCount}</Text>
              <Text style={styles.statLabel}>lifetime workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{progress.longestStreakDays}</Text>
              <Text style={styles.statLabel}>longest streak</Text>
            </View>
          </View>

          <BadgeSection badges={badgesFor(progress, "lifetime_workouts")} title="Lifetime workouts" />
          <BadgeSection badges={badgesFor(progress, "streak")} title="Streaks" />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  header: {
    gap: theme.spacing.xs
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800"
  },
  body: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 23
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  statCard: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    alignItems: "center"
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800"
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  badgeCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm
  },
  badgeCardAchieved: {
    borderColor: theme.colors.primary,
    backgroundColor: "#e9f7f1"
  },
  badgeCardLocked: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    opacity: 0.6
  },
  badgeIcon: {
    fontSize: 22
  },
  badgeLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  badgeLabelLocked: {
    color: theme.colors.muted
  }
});
