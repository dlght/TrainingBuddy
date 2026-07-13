import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { profileService } from "@/features/profile/profileService";
import { formatShortDateWithYear } from "@/features/progress/progressCalculations";
import { historyService, type CompletedSessionSummary } from "@/features/progress/historyService";
import { buildMonthGrid, formatMonthLabel, shiftMonth } from "@/features/progress/monthCalendar";
import { formatDuration, getElapsedSeconds } from "@/features/sessions/duration";
import { getEffortRatingMeta } from "@/features/sessions/effortRating";
import { computeSessionBreakdown, type SessionBreakdown } from "@/features/sessions/sessionBreakdown";
import type { WeightUnit } from "@/models/user";

const WEEKDAY_HEADER_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function todayDateKey(): string {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function groupSessionsByDate(sessions: CompletedSessionSummary[]): Map<string, CompletedSessionSummary[]> {
  const map = new Map<string, CompletedSessionSummary[]>();

  for (const session of sessions) {
    const key = session.endedAt.slice(0, 10);
    const existing = map.get(key) ?? [];

    existing.push(session);
    map.set(key, existing);
  }

  return map;
}

export default function HistoryScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [sessionsByDate, setSessionsByDate] = useState<Map<string, CompletedSessionSummary[]>>(new Map());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [breakdownBySession, setBreakdownBySession] = useState<Map<string, SessionBreakdown>>(new Map());
  const hasAutoSelectedRef = useRef(false);

  const loadMonth = useCallback(() => {
    const startIso = new Date(year, monthIndex, 1).toISOString();
    const endIsoExclusive = new Date(year, monthIndex + 1, 1).toISOString();

    historyService
      .listCompletedSessionsInRange(startIso, endIsoExclusive)
      .then((sessions) => {
        const map = groupSessionsByDate(sessions);

        setSessionsByDate(map);
        setError(null);

        if (!hasAutoSelectedRef.current) {
          hasAutoSelectedRef.current = true;

          if (map.has(todayDateKey())) {
            setSelectedDateKey(todayDateKey());
          }
        }
      })
      .catch((loadError) => {
        console.error("Workout history could not be loaded.", loadError);
        setError("Workout history could not be loaded.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [year, monthIndex]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useFocusEffect(
    useCallback(() => {
      loadMonth();
    }, [loadMonth])
  );

  useEffect(() => {
    let mounted = true;

    profileService
      .getProfile()
      .then((profile) => {
        if (mounted) {
          setWeightUnit(profile?.weightUnit ?? "kg");
        }
      })
      .catch((profileError) => {
        console.error("Profile could not be loaded for weight unit.", profileError);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const sessions = selectedDateKey ? sessionsByDate.get(selectedDateKey) ?? [] : [];

    Promise.all(
      sessions.map((session) =>
        historyService
          .listSetLogsForSession(session.id)
          .then(
            (setLogs) =>
              [session.id, computeSessionBreakdown(session.startedAt, session.endedAt, setLogs)] as const
          )
      )
    )
      .then((entries) => {
        if (mounted) {
          setBreakdownBySession(new Map(entries));
        }
      })
      .catch((breakdownError) => {
        console.error("Session breakdown could not be loaded.", breakdownError);
      });

    return () => {
      mounted = false;
    };
  }, [selectedDateKey, sessionsByDate]);

  const goToMonth = (delta: number) => {
    const next = shiftMonth(year, monthIndex, delta);

    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };

  const grid = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
  const selectedSessions = selectedDateKey ? sessionsByDate.get(selectedDateKey) ?? [] : [];

  return (
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>History</Text>
        <Text style={styles.title}>Workout history</Text>
        <Text style={styles.body}>Days you worked out are marked below. Tap a day to see its details.</Text>
      </View>

      {error ? <ErrorState message={error} title="History" /> : null}

      <View style={styles.calendarCard}>
        <View style={styles.monthNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => goToMonth(-1)}
            style={styles.monthNavButton}
          >
            <Text style={styles.monthNavButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{formatMonthLabel(year, monthIndex)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => goToMonth(1)}
            style={styles.monthNavButton}
          >
            <Text style={styles.monthNavButtonText}>›</Text>
          </Pressable>
        </View>

        {isLoading ? <LoadingState inline message="Loading history" /> : null}

        <View style={styles.weekdayRow}>
          {WEEKDAY_HEADER_LABELS.map((label, index) => (
            <Text key={`weekday-${index}`} style={styles.weekdayLabel}>
              {label}
            </Text>
          ))}
        </View>

        {grid.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((dateKey, dayIndex) => {
              if (!dateKey) {
                return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
              }

              const hasWorkout = sessionsByDate.has(dateKey);
              const isSelected = selectedDateKey === dateKey;
              const dayNumber = Number(dateKey.slice(-2));

              return (
                <Pressable
                  key={dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={`${dateKey}${hasWorkout ? ", workout logged" : ""}`}
                  onPress={() => setSelectedDateKey(dateKey)}
                  style={[
                    styles.dayCell,
                    hasWorkout ? styles.dayCellMarked : null,
                    isSelected ? styles.dayCellSelected : null
                  ]}
                >
                  <Text style={[styles.dayNumber, isSelected ? styles.dayNumberSelected : null]}>{dayNumber}</Text>
                  {hasWorkout ? <View style={styles.dayDot} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {selectedDateKey && selectedSessions.length === 0 ? (
        <View style={styles.emptyDayCard}>
          <Text style={styles.emptyDayText}>No workout this day.</Text>
        </View>
      ) : null}

      {!selectedDateKey ? (
        <View style={styles.emptyDayCard}>
          <Text style={styles.emptyDayText}>Tap a marked day above to see its workout details.</Text>
        </View>
      ) : null}

      {selectedSessions.map((session) => {
        const breakdown = breakdownBySession.get(session.id);
        const ratingMeta = getEffortRatingMeta(session.rating);

        return (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${session.workoutName}`}
            onPress={() => router.push(`/workouts/${session.workoutId}`)}
            style={styles.sessionCard}
          >
            <View style={styles.sessionCardHeader}>
              <Text style={styles.sessionName} numberOfLines={1}>
                {session.workoutName}
              </Text>
              <View style={styles.ratingBubble}>
                <Text style={styles.ratingBubbleEmoji}>{ratingMeta.emoji}</Text>
                <Text style={styles.ratingBubbleLabel} numberOfLines={1}>
                  {ratingMeta.label}
                </Text>
              </View>
            </View>

            <View style={styles.sessionMetaRow}>
              <Text style={styles.sessionMetaText}>{formatShortDateWithYear(session.endedAt)}</Text>
              <Text style={styles.sessionMetaText}>
                ⏱ {formatDuration(getElapsedSeconds(session.startedAt, session.endedAt))} duration
              </Text>
            </View>

            {breakdown ? (
              <View style={styles.statGrid}>
                <View style={styles.statChip}>
                  <Text style={styles.statChipText}>
                    {breakdown.exerciseCount} {breakdown.exerciseCount === 1 ? "exercise" : "exercises"}
                  </Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipText}>
                    {session.totalVolume} {weightUnit} volume
                  </Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipText}>Working {formatDuration(breakdown.workingSeconds)}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipText}>Resting {formatDuration(breakdown.restingSeconds)}</Text>
                </View>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
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
  calendarCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs
  },
  monthNavButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  monthNavButtonText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  monthLabel: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  weekdayRow: {
    flexDirection: "row"
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  weekRow: {
    flexDirection: "row"
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
    borderRadius: theme.radius.sm
  },
  dayCellMarked: {
    backgroundColor: "#e9f7f1"
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary
  },
  dayNumber: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  dayNumberSelected: {
    color: theme.colors.primaryText
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 2
  },
  emptyDayCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    alignItems: "center"
  },
  emptyDayText: {
    color: theme.colors.muted,
    fontSize: 15,
    textAlign: "center"
  },
  sessionCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
    padding: theme.spacing.md
  },
  sessionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  sessionName: {
    flex: 1,
    color: theme.colors.primary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  ratingBubble: {
    alignItems: "center",
    gap: 2,
    maxWidth: 90,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  ratingBubbleEmoji: {
    fontSize: 20
  },
  ratingBubbleLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center"
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  sessionMetaText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  statChip: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  statChipText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  }
});
