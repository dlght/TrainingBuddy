import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { ExerciseLabel } from "@/components/ExerciseLabel";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { profileService } from "@/features/profile/profileService";
import { dashboardService } from "@/features/progress/dashboardService";
import type { WeeklyDashboardStats } from "@/features/progress/dashboardStats";
import { streakService } from "@/features/progress/streakService";
import { sessionService, type ActiveSessionDetails } from "@/features/sessions/sessionService";
import { workoutRecommendationService } from "@/features/workouts/workoutRecommendationService";
import type { UserProfile } from "@/models/user";

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionDetails | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isDiscardingSession, setIsDiscardingSession] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [suggestedWorkouts, setSuggestedWorkouts] = useState<{ id: string; name: string; isFavourite: boolean }[] | null>(null);
  const [dashboardStats, setDashboardStats] = useState<WeeklyDashboardStats | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);

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
        } catch (error) {
          console.error("Active session could not be checked.", error);

          if (mounted) {
            setStartupError("Active session could not be checked.");
          }
        }
      } catch (error) {
        console.error("Startup profile check failed; redirecting to profile setup.", error);

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

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadSuggestions() {
        try {
          const suggestions = await workoutRecommendationService.getSuggestedWorkouts();
          if (mounted) setSuggestedWorkouts(suggestions);
        } catch (error) {
          console.error("Suggested workouts could not be loaded.", error);
          if (mounted) setSuggestedWorkouts([]);
        }
      }

      void loadSuggestions();

      return () => {
        mounted = false;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadDashboardStats() {
        try {
          const stats = await dashboardService.getWeeklyDashboardStats();
          if (mounted) setDashboardStats(stats);
        } catch (error) {
          console.error("Dashboard stats could not be loaded.", error);
          if (mounted) setDashboardStats({ days: [], consistencyPercent: 0 });
        }

        try {
          const streak = await streakService.getCurrentStreak();
          if (mounted) setStreakDays(streak);
        } catch (error) {
          console.error("Streak could not be loaded.", error);
          if (mounted) setStreakDays(0);
        }
      }

      void loadDashboardStats();

      return () => {
        mounted = false;
      };
    }, [activeSession])
  );

  const discardActiveSession = async () => {
    if (!activeSession) {
      return;
    }

    setIsDiscardingSession(true);
    setStartupError(null);

    try {
      await sessionService.discardSession(activeSession.session.id);
      setActiveSession(null);
    } catch (error) {
      console.error("Active session could not be discarded.", error);
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
        <View style={styles.topHeader}>
          <Text style={styles.topHeaderTitle}>TrainingBuddy</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            onPress={() => router.push("/profile/setup")}
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonText}>
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
          {suggestedWorkouts === null ? (
            <Text style={styles.body}>Loading your suggested workouts…</Text>
          ) : suggestedWorkouts.length === 0 ? (
            <Text style={styles.body}>No workouts available yet.</Text>
          ) : (
            <View style={styles.topBubbles}>
              {suggestedWorkouts.slice(0, 3).map((workout, index) => (
                <Pressable
                  key={workout.id}
                  style={[
                    styles.topBubble,
                    {
                      borderColor: index === 0 ? "#1f7a5f" : index === 1 ? "#4338ca" : "#c26a00",
                      backgroundColor: index === 0 ? "#e6f6ee" : index === 1 ? "#eef0ff" : "#fff6e6"
                    }
                  ]}
                  accessibilityRole="button"
                  onPress={() => router.push(`/workouts/${workout.id}`)}
                >
                  <View style={styles.topBubbleHeader}>
                    <View style={[styles.favoriteDot, { backgroundColor: index === 0 ? "#1f7a5f" : index === 1 ? "#4338ca" : "#c26a00" }]} />
                    <Text style={styles.topBubbleRank}>#{index + 1}</Text>
                    {workout.isFavourite && <Text style={styles.favouriteIcon}>❤️</Text>}
                  </View>
                  <ExerciseLabel name={workout.name} style={styles.topBubbleName} maxChars={22} />
                  <Text style={styles.topBubbleSub}>Suggested for you</Text>
                </Pressable>
              ))}
            </View>
          )}
          
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {dashboardStats === null ? "…" : `${dashboardStats.consistencyPercent}%`}
                </Text>
                <Text style={styles.statLabel}>consistency</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {streakDays === null ? "…" : streakDays > 0 ? `🔥 ${streakDays}` : "0"}
                </Text>
                <Text style={styles.statLabel}>day streak</Text>
              </View>
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
          {dashboardStats === null ? (
            <Text style={styles.body}>Loading your workout trend…</Text>
          ) : (
            <>
              <View style={styles.chartRow}>
                {(() => {
                  const maxVolume = Math.max(1, ...dashboardStats.days.map((day) => day.volume));

                  return dashboardStats.days.map((day) => (
                    <View key={day.dateKey} style={styles.chartColumn}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: day.volume === 0 ? 4 : Math.max(8, (day.volume / maxVolume) * 120) }
                        ]}
                      />
                      <Text style={styles.chartLabel}>{day.label}</Text>
                    </View>
                  ));
                })()}
              </View>
              <Text style={styles.chartCaption}>
                {dashboardStats.days.every((day) => day.volume === 0)
                  ? "No workouts logged yet this week."
                  : "Your recent weekly workout volume"}
              </Text>
            </>
          )}
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
        <Pressable accessibilityRole="button" onPress={() => router.push("/history")} style={styles.navItem}>
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  topHeaderTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary
  },
  profileButtonText: {
    color: theme.colors.primaryText,
    fontSize: 15,
    fontWeight: "800"
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
  favoriteDot: {
    width: 10,
    height: 10,
    borderRadius: 5
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
  favouriteIcon: {
    fontSize: 16,
    marginLeft: "auto"
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
