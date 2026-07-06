import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { ExerciseLabel } from "@/components/ExerciseLabel";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { profileService } from "@/features/profile/profileService";
import { sessionService, type ActiveSessionDetails } from "@/features/sessions/sessionService";
import type { UserProfile } from "@/models/user";
import { formatShortDate } from "@/features/progress/progressCalculations";

const weeklyBars = [3, 5, 4, 6, 7, 4];
const weekLabels = ["M", "T", "W", "T", "F", "S"];
const favoriteWorkouts = [
  { name: "Upper Body Push", count: 12, accent: "#1f7a5f" },
  { name: "Leg Day", count: 8, accent: "#4338ca" },
  { name: "Core Flow", count: 6, accent: "#c26a00" }
];

const quickActions = [
  { label: "Workouts", route: "/workouts", icon: "🏋️", bg: "#e9f7f1", tint: "#1f7a5f" },
  { label: "Exercises", route: "/exercises", icon: "💪", bg: "#fef3e2", tint: "#c26a00" },
  { label: "Progress", route: "/progress/placeholder", icon: "📈", bg: "#eef2ff", tint: "#4338ca" },
  { label: "Profile", route: "/profile/setup", icon: "👤", bg: "#fef2f2", tint: "#b42318" }
];

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionDetails | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isDiscardingSession, setIsDiscardingSession] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [topWorkouts, setTopWorkouts] = useState<{ workoutId: string; name: string; runCount: number; lastRun: string | null }[] | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStartupState() {
      try {
        const loadedProfile = await profileService.getProfile();

        if (!mounted) {
          return;
        }

        if (!loadedProfile) {
          router.replace("/profile/setup");
          return;
        }

        setProfile(loadedProfile);

        try {
          const resumedSession = await sessionService.resumeActiveSession();

          if (mounted) {
            setActiveSession(resumedSession);
          }
        } catch {
          if (mounted) {
            setStartupError("Active session could not be checked.");
          }
        }
      } catch {
        if (mounted) {
          router.replace("/profile/setup");
        }
      } finally {
        if (mounted) {
          setIsCheckingProfile(false);
        }
      }
    }

    void loadStartupState();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    let mounted = true;

    async function loadTop() {
      try {
        const [{ getDatabaseClient }, { runMigrations }, { loadSeedData }] = await Promise.all([
          import("@/db/client"),
          import("@/db/migrate"),
          import("@/db/seed/loadSeedData")
        ]);

        const { adapter } = await getDatabaseClient();
        await runMigrations(adapter);
        await loadSeedData(adapter);
        const { createWorkoutRepository } = await import("@/db/repositories/workoutRepository");
        const repo = createWorkoutRepository(adapter as any);
        const top = await repo.getTopWorkouts(3);

        if (mounted) setTopWorkouts(top);
      } catch {
        if (mounted) setTopWorkouts([]);
      }
    }

    void loadTop();

    return () => {
      mounted = false;
    };
  }, []);

  const discardActiveSession = async () => {
    if (!activeSession) {
      return;
    }

    setIsDiscardingSession(true);
    setStartupError(null);

    try {
      await sessionService.discardSession(activeSession.session.id);
      setActiveSession(null);
    } catch {
      setStartupError("Active session could not be discarded.");
    } finally {
      setIsDiscardingSession(false);
    }
  };

  if (isCheckingProfile) {
    return <LoadingState message="Checking your local profile" title="TrainingBuddy" />;
  }

  return (
    <View style={styles.page}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
          {topWorkouts === null ? (
            <Text style={styles.body}>Loading your top workouts…</Text>
          ) : topWorkouts.length === 0 ? (
            <Text style={styles.body}>No workouts logged yet.</Text>
          ) : (
            <View style={styles.topBubbles}>
              {topWorkouts.slice(0, 3).map((workout, index) => (
                <Pressable
                  key={workout.workoutId}
                  style={[
                    styles.topBubble,
                    {
                      borderColor: index === 0 ? "#1f7a5f" : index === 1 ? "#4338ca" : "#c26a00",
                      backgroundColor: index === 0 ? "#e6f6ee" : index === 1 ? "#eef0ff" : "#fff6e6"
                    }
                  ]}
                  accessibilityRole="button"
                  onPress={() => router.push(`/workouts/${workout.workoutId}`)}
                >
                  <View style={styles.topBubbleHeader}>
                    <View style={[styles.favoriteDot, { backgroundColor: index === 0 ? "#1f7a5f" : index === 1 ? "#4338ca" : "#c26a00" }]} />
                    <Text style={styles.topBubbleRank}>#{index + 1}</Text>
                  </View>
                  <ExerciseLabel name={workout.name} style={styles.topBubbleName} maxChars={22} />
                  <Text style={styles.topBubbleSub}>{workout.runCount} runs • {workout.lastRun ? formatShortDate(workout.lastRun) : "-"}</Text>
                </Pressable>
              ))}
            </View>
          )}
          
          {/* Fallback static favorites removed in favor of dynamic top workouts */}
          
            <View style={styles.statCard}>
              <Text style={styles.statValue}>82%</Text>
              <Text style={styles.statLabel}>consistency</Text>
            </View>
          </View>
        </View>

        {startupError ? <ErrorState message={startupError} title="Startup check" /> : null}

        {activeSession ? (
          <View style={styles.sessionCard}>
            <Text style={styles.sectionTitle}>Workout in progress</Text>
            <Text style={styles.sessionText}>Resume {activeSession.session.workoutNameSnapshot} or discard it before starting another workout.</Text>
            <View style={styles.sessionActions}>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/workouts/${activeSession.workout.id}/session`)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Resume workout</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={isDiscardingSession} onPress={discardActiveSession} style={[styles.dangerButton, isDiscardingSession ? styles.disabledButton : null]}>
                <Text style={styles.dangerButtonText}>{isDiscardingSession ? "Discarding session" : "Discard session"}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Workout trend</Text>
          <View style={styles.chartRow}>
            {weeklyBars.map((height, index) => (
              <View key={`week-${index}`} style={styles.chartColumn}>
                <View style={[styles.chartBar, { height: height * 10 }]} />
                <Text style={styles.chartLabel}>{weekLabels[index]}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartCaption}>Your recent weekly workout volume</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Favorite workouts</Text>
          {favoriteWorkouts.map((workout, index) => (
            <View key={`${workout.name}-${index}`} style={styles.favoriteRow}>
              <View style={styles.favoriteMeta}>
                <View style={[styles.favoriteDot, { backgroundColor: workout.accent }]} />
                <View>
                  <Text style={styles.favoriteName}>{workout.name}</Text>
                  <Text style={styles.favoriteCount}>{workout.count} sessions</Text>
                </View>
              </View>
              <Text style={styles.favoriteRank}>#{index + 1}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.bubbleGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.route} accessibilityRole="button" onPress={() => router.push(action.route as any)} style={[styles.bubble, { backgroundColor: action.bg }]}>
                <Text style={styles.bubbleIcon}>{action.icon}</Text>
                <Text style={[styles.bubbleLabel, { color: action.tint }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/")} style={styles.navItemActive}>
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navLabelActive}>Home</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/workouts")} style={styles.navItem}>
          <Text style={styles.navIcon}>🏋️</Text>
          <Text style={styles.navLabel}>Workouts</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/progress/placeholder")} style={styles.navItem}>
          <Text style={styles.navIcon}>📈</Text>
          <Text style={styles.navLabel}>Progress</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: 110
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm
  },
  heroCopy: {
    flex: 1,
    gap: theme.spacing.xs
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800"
  },
  body: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: theme.spacing.md,
    backgroundColor: "#f8fafc"
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  sessionCard: {
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  sectionCard: {
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: theme.spacing.sm
  },
  sessionText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  sessionActions: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm
  },
  primaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 15,
    fontWeight: "800"
  },
  dangerButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fecdca",
    backgroundColor: "#fef3f2",
    paddingHorizontal: theme.spacing.md
  },
  dangerButtonText: {
    color: "#b42318",
    fontSize: 15,
    fontWeight: "800"
  },
  disabledButton: {
    opacity: 0.65
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    marginTop: theme.spacing.sm
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    gap: theme.spacing.xs
  },
  chartBar: {
    width: 22,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    minHeight: 20
  },
  chartLabel: {
    color: theme.colors.muted,
    fontSize: 12
  },
  chartCaption: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: 13
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7"
  },
  favoriteMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1
  },
  favoriteDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  favoriteName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  favoriteCount: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  favoriteRank: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  topBubbles: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  topBubble: {
    flex: 1,
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    backgroundColor: "#fff",
    marginRight: theme.spacing.sm,
    minHeight: 96,
    justifyContent: "center"
  },
  topBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs
  },
  topBubbleRank: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  topBubbleName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4
  },
  topBubbleSub: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 6
  },
  bubbleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  bubble: {
    width: "48%",
    minHeight: 96,
    borderRadius: 20,
    padding: theme.spacing.md,
    justifyContent: "center",
    gap: theme.spacing.xs
  },
  bubbleIcon: {
    fontSize: 22
  },
  bubbleLabel: {
    fontSize: 15,
    fontWeight: "700"
  },
  bottomNav: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 8
  },
  navItemActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 8,
    backgroundColor: "#e9f7f1"
  },
  navIcon: {
    fontSize: 18
  },
  navLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },
  navLabelActive: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
    fontWeight: "700"
  }
});
