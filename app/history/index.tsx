import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { formatShortDate } from "@/features/progress/progressCalculations";
import { historyService, type CompletedSessionSummary } from "@/features/progress/historyService";
import { formatDuration, getElapsedSeconds } from "@/features/sessions/duration";
import { getEffortRatingMeta } from "@/features/sessions/effortRating";

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<CompletedSessionSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      historyService
        .listCompletedSessions()
        .then((result) => {
          if (mounted) {
            setSessions(result);
          }
        })
        .catch((loadError) => {
          console.error("Workout history could not be loaded.", loadError);

          if (mounted) {
            setError("Workout history could not be loaded.");
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
        <Text style={styles.eyebrow}>History</Text>
        <Text style={styles.title}>Workout history</Text>
        <Text style={styles.body}>Every workout you've finished, most recent first.</Text>
      </View>

      {isLoading ? <LoadingState inline message="Loading history" /> : null}

      {error ? <ErrorState message={error} title="History" /> : null}

      {!isLoading && sessions && sessions.length === 0 ? (
        <EmptyState
          title="No workouts finished yet"
          message="Finish a workout and it will show up here."
        />
      ) : null}

      {sessions?.map((session) => (
        <Pressable
          key={session.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${session.workoutName}`}
          onPress={() => router.push(`/workouts/${session.workoutId}`)}
          style={styles.sessionCard}
        >
          <Text style={styles.sessionName}>{session.workoutName}</Text>
          <Text style={styles.sessionMeta}>
            {formatShortDate(session.endedAt)} - {formatDuration(getElapsedSeconds(session.startedAt, session.endedAt))} -{" "}
            {session.totalSets} {session.totalSets === 1 ? "set" : "sets"}
            {session.totalVolume > 0 ? ` - ${session.totalVolume} volume` : ""}
          </Text>
          <Text style={styles.sessionRating}>
            {getEffortRatingMeta(session.rating).emoji} {getEffortRatingMeta(session.rating).label}
          </Text>
        </Pressable>
      ))}
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
  sessionCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  sessionName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  sessionMeta: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: "600"
  },
  sessionRating: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600"
  }
});
