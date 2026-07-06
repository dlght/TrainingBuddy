import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { SessionHistoryList } from "@/features/progress/SessionHistoryList";
import { SetHistoryTable } from "@/features/progress/SetHistoryTable";
import { VolumeTrendChart } from "@/features/progress/VolumeTrendChart";
import { WeightTrendChart } from "@/features/progress/WeightTrendChart";
import {
  progressService,
  type ExerciseProgressData
} from "@/features/progress/progressService";

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function ProgressScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const id = firstParam(exerciseId);
  const [progressData, setProgressData] = useState<ExerciseProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!id) {
      Promise.resolve().then(() => {
        if (mounted) {
          setError("Exercise progress could not be found.");
          setIsLoading(false);
        }
      });
      return;
    }

    progressService
      .getExerciseProgress(id)
      .then((data) => {
        if (mounted) {
          setProgressData(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Exercise progress could not be loaded.");
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
  }, [id]);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Progress</Text>
        <Text style={styles.title}>{progressData?.exercise?.name ?? "Exercise progress"}</Text>
        <Text style={styles.body}>Completed sessions and set trends for this exercise.</Text>
      </View>

      {isLoading ? (
        <LoadingState inline message="Loading progress" />
      ) : null}

      {error ? <ErrorState message={error} title="Progress" /> : null}

      {progressData ? (
        <>
          <SessionHistoryList sessions={progressData.sessions} />
          <SetHistoryTable sets={progressData.historySets} />
          <WeightTrendChart points={progressData.weightPoints} />
          <VolumeTrendChart points={progressData.volumePoints} />
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
  }
});
