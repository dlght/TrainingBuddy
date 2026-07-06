import { Link } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { WorkoutEmptyState } from "@/features/workouts/WorkoutEmptyState";
import {
  workoutListService,
  type WorkoutListData
} from "@/features/workouts/workoutListService";
import type { WorkoutWithExercises } from "@/models/workout";

function WorkoutSection({
  emptyState,
  title,
  workouts,
  emptyText
}: {
  emptyState?: ReactNode;
  title: string;
  workouts: WorkoutWithExercises[];
  emptyText?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {workouts.length === 0 ? emptyState ?? <Text style={styles.emptyText}>{emptyText}</Text> : null}
      {workouts.map((workout) => (
        <View key={workout.id} style={styles.workoutCard}>
          <Link href={`/workouts/${workout.id}`}>{workout.name}</Link>
          <Text style={styles.workoutMeta}>
            {workout.exercises.length} {workout.exercises.length === 1 ? "exercise" : "exercises"}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function WorkoutsScreen() {
  const [workoutData, setWorkoutData] = useState<WorkoutListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    workoutListService
      .listWorkouts()
      .then((data) => {
        if (mounted) {
          setWorkoutData(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Workouts could not be loaded.");
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
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Workouts</Text>
        <Text style={styles.title}>Workouts</Text>
        <Link href="/workouts/new">Create workout</Link>
      </View>

      {isLoading ? (
        <LoadingState inline message="Loading workouts" />
      ) : null}

      {error ? <ErrorState message={error} title="Workouts" /> : null}

      {workoutData ? (
        <>
          <WorkoutSection
            title="Sample workouts"
            workouts={workoutData.sampleWorkouts}
            emptyText="No sample workouts are available."
          />
          <WorkoutSection
            title="Custom workouts"
            workouts={workoutData.customWorkouts}
            emptyState={<WorkoutEmptyState />}
          />
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
    gap: theme.spacing.sm
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
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  workoutCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  workoutMeta: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: "600"
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  }
});
