import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { exerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import { ExerciseImageFallback } from "@/features/exercises/ExerciseImageFallback";
import { resolveExerciseImage } from "@/features/exercises/exerciseImageResolver";
import { workoutBuilderService } from "@/features/workouts/workoutBuilderService";
import { formatRepRange } from "@/features/workouts/repRangeFormat";
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
      .catch((error) => {
        console.error("Workout could not be loaded.", error);

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

  const exercisesById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
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
      router.replace(`/workouts/new?workoutId=${copy.id}`);
    } catch (error) {
      console.error("Sample workout could not be copied.", error);
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
    } catch (error) {
      console.error("Workout could not be deleted.", error);
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
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/workouts/${workout.id}/session`)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Start session</Text>
              </Pressable>
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
                style={[styles.secondaryButton, isBusy ? styles.disabled : null]}
              >
                <Text style={styles.secondaryButtonText}>
                  {isBusy ? "Copying workout" : "Copy to edit"}
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/workouts/new?workoutId=${workout.id}`)}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Edit workout</Text>
                </Pressable>
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
            {workout.exercises.map((exercise) => {
              const libraryExercise = exercisesById.get(exercise.exerciseId);
              const image = libraryExercise ? resolveExerciseImage(libraryExercise) : null;

              return (
                <View key={exercise.id} style={styles.exerciseRow}>
                  {image?.kind === "remote" ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      resizeMode="cover"
                      source={{ uri: image.uri }}
                      style={styles.exerciseImage}
                    />
                  ) : (
                    <ExerciseImageFallback compact />
                  )}
                  <View style={styles.exerciseRowContent}>
                    <Text style={styles.exerciseName}>
                      {exercise.orderIndex + 1}. <ExerciseLabel name={exerciseNamesById.get(exercise.exerciseId) ?? exercise.exerciseId} style={styles.exerciseName} />
                    </Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.targetSets} sets - {formatRepRange(exercise.targetRepRangeLow, exercise.targetRepRangeHigh)}{" "}
                      reps - {exercise.targetRestSeconds}s rest
                    </Text>
                  </View>
                </View>
              );
            })}
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
    flexDirection: "row",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
    padding: theme.spacing.md
  },
  exerciseImage: {
    width: 72,
    minHeight: 64,
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee"
  },
  exerciseRowContent: {
    flex: 1,
    gap: theme.spacing.xs,
    justifyContent: "center"
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
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 18,
    fontWeight: "800"
  },
  secondaryButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
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
