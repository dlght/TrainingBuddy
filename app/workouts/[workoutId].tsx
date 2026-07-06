import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { exerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import { workoutBuilderService } from "@/features/workouts/workoutBuilderService";
import type { Exercise } from "@/models/exercise";
import type { WorkoutWithExercises } from "@/models/workout";
import { ExerciseLabel } from "@/components/ExerciseLabel";

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const id = firstParam(workoutId);
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!id) {
      Promise.resolve().then(() => {
        if (mounted) {
          setError("Workout could not be found.");
          setIsLoading(false);
        }
      });
      return;
    }

    Promise.all([
      workoutBuilderService.getWorkout(id),
      exerciseLibraryService.getLibraryData()
    ])
      .then(([loadedWorkout, libraryData]) => {
        if (!mounted) {
          return;
        }

        if (!loadedWorkout) {
          setError("Workout could not be found.");
          return;
        }

        setWorkout(loadedWorkout);
        setExercises(libraryData.exercises);
      })
      .catch(() => {
        if (mounted) {
          setError("Workout could not be loaded.");
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

  const exerciseNamesById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise.name])),
    [exercises]
  );

  const copyTemplate = async () => {
    if (!workout) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const copy = await workoutBuilderService.copyTemplateWorkout(workout.id);
      router.replace(`/workouts/${copy.id}`);
    } catch {
      setError("Sample workout could not be copied.");
    } finally {
      setIsBusy(false);
    }
  };

  const deleteWorkout = async () => {
    if (!workout) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await workoutBuilderService.deleteCustomWorkout(workout.id);
      router.replace("/workouts");
    } catch {
      setError("Workout could not be deleted.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Workout detail</Text>
        <Text style={styles.title}>{workout?.name ?? "Workout"}</Text>
        {workout ? (
          <Text style={styles.meta}>
            {workout.isTemplate ? "Sample workout" : "Custom workout"} - {workout.exercises.length}{" "}
            {workout.exercises.length === 1 ? "exercise" : "exercises"}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <LoadingState inline message="Loading workout" />
      ) : null}

      {error ? <ErrorState message={error} title="Workout" /> : null}

      {workout ? (
        <>
          <View style={styles.actions}>
            {workout.exercises.length > 0 ? (
              <Link href={`/workouts/${workout.id}/session`}>Start session</Link>
            ) : (
              <EmptyState
                title="No exercises selected"
                message="Add at least one exercise before starting this workout."
              />
            )}
            {workout.isTemplate ? (
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={copyTemplate}
                style={[styles.primaryButton, isBusy ? styles.disabled : null]}
              >
                <Text style={styles.primaryButtonText}>
                  {isBusy ? "Copying workout" : "Copy to edit"}
                </Text>
              </Pressable>
            ) : (
              <>
                <Link href={`/workouts/new?workoutId=${workout.id}`}>Edit workout</Link>
                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={deleteWorkout}
                  style={[styles.dangerButton, isBusy ? styles.disabled : null]}
                >
                  <Text style={styles.dangerButtonText}>
                    {isBusy ? "Deleting workout" : "Delete workout"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            {workout.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>
                      {exercise.orderIndex + 1}. <ExerciseLabel name={exerciseNamesById.get(exercise.exerciseId) ?? exercise.exerciseId} style={styles.exerciseName} />
                    </Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.targetSets} sets - {exercise.targetRepRangeLow}-{exercise.targetRepRangeHigh} reps -{" "}
                  {exercise.targetRestSeconds}s rest
                  {exercise.supersetGroupId ? ` - ${exercise.supersetGroupId}` : ""}
                </Text>
              </View>
            ))}
          </View>
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
  meta: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: "700"
  },
  actions: {
    gap: theme.spacing.sm
  },
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  exerciseRow: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  exerciseName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  exerciseMeta: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: "800"
  },
  dangerButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
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
  disabled: {
    opacity: 0.65
  }
});
