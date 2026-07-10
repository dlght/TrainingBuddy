import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { WorkoutEmptyState } from "@/features/workouts/WorkoutEmptyState";
import { workoutBuilderService } from "@/features/workouts/workoutBuilderService";
import {
  workoutListService,
  type WorkoutListData
} from "@/features/workouts/workoutListService";
import type { WorkoutWithExercises } from "@/models/workout";

function WorkoutSection({
  emptyState,
  title,
  workouts,
  emptyText,
  onToggleFavourite
}: {
  emptyState?: ReactNode;
  title: string;
  workouts: WorkoutWithExercises[];
  emptyText?: string;
  onToggleFavourite?: (workoutId: string) => void;
}) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {workouts.length === 0 ? emptyState ?? <Text style={styles.emptyText}>{emptyText}</Text> : null}
      {workouts.map((workout) => (
        <Pressable
          key={workout.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${workout.name}`}
          onPress={() => router.push(`/workouts/${workout.id}`)}
          style={styles.workoutCard}
        >
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            {onToggleFavourite && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={workout.isFavourite ? "Remove from favourites" : "Add to favourites"}
                onPress={() => onToggleFavourite(workout.id)}
                style={styles.favouriteButton}
              >
                <Text style={styles.favouriteIcon}>{workout.isFavourite ? "❤️" : "🤍"}</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.workoutMeta}>
            {workout.exercises.length} {workout.exercises.length === 1 ? "exercise" : "exercises"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function WorkoutsScreen() {
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState<WorkoutListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFavourite = async (workoutId: string) => {
    try {
      await workoutBuilderService.toggleFavourite(workoutId);

      const data = await workoutListService.listWorkouts();
      setWorkoutData(data);
    } catch (error) {
      console.error("Could not toggle favourite.", error);
      setError("Could not toggle favourite.");
    }
  };

  useEffect(() => {
    let mounted = true;

    workoutListService
      .listWorkouts()
      .then((data) => {
        if (mounted) {
          setWorkoutData(data);
        }
      })
      .catch((error) => {
        console.error("Workouts could not be loaded.", error);

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create workout"
          onPress={() => router.push("/workouts/new")}
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>+ Create workout</Text>
        </Pressable>
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
            onToggleFavourite={handleToggleFavourite}
          />
          <WorkoutSection
            title="Custom workouts"
            workouts={workoutData.customWorkouts}
            emptyState={<WorkoutEmptyState />}
            onToggleFavourite={handleToggleFavourite}
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
  createButton: {
    alignSelf: "flex-start",
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg
  },
  createButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: "800"
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
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  workoutName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    flex: 1
  },
  favouriteButton: {
    padding: theme.spacing.xs
  },
  favouriteIcon: {
    fontSize: 20
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
