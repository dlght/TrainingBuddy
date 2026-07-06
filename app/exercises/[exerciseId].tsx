import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { ExerciseImageFallback } from "@/features/exercises/ExerciseImageFallback";
import { exerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import { resolveExerciseImage } from "@/features/exercises/exerciseImageResolver";
import { formatMuscleGroupName } from "@/features/exercises/exerciseSelectors";
import type { Exercise } from "@/models/exercise";

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const id = Array.isArray(exerciseId) ? exerciseId[0] : exerciseId;

    if (!id) {
      Promise.resolve().then(() => {
        if (mounted) {
          setError("Exercise could not be found.");
          setIsLoading(false);
        }
      });
      return;
    }

    exerciseLibraryService
      .getExerciseById(id)
      .then((loadedExercise) => {
        if (!mounted) {
          return;
        }

        if (!loadedExercise) {
          setError("Exercise could not be found.");
          return;
        }

        setExercise(loadedExercise);
      })
      .catch(() => {
        if (mounted) {
          setError("Exercise could not be loaded.");
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
  }, [exerciseId]);

  if (isLoading) {
    return <LoadingState message="Loading exercise" title="Exercise" />;
  }

  if (error || !exercise) {
    return (
      <View style={styles.centered}>
        <ErrorState
          actions={<Link href="/exercises">Back to exercises</Link>}
          message={error ?? "Exercise could not be found."}
          title="Exercise"
        />
      </View>
    );
  }

  const image = resolveExerciseImage(exercise);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Exercise detail</Text>
        <Text style={styles.title}>{exercise.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaPill}>{formatMuscleGroupName(exercise.muscleGroupId)}</Text>
          <Text style={styles.metaPill}>{exercise.equipment ?? "No equipment"}</Text>
          <Text style={exercise.isWarmup ? styles.warmupPill : styles.metaPill}>
            {exercise.isWarmup ? "Warmup friendly" : "Working exercise"}
          </Text>
        </View>
      </View>

      {image.kind === "placeholder" ? (
        <ExerciseImageFallback />
      ) : (
        <View style={styles.visual}>
          <Text style={styles.visualText}>Exercise image</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructions}>{exercise.instructions}</Text>
      </View>

      {exercise.videoUrl ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video</Text>
          <Text style={styles.instructions}>{exercise.videoUrl}</Text>
        </View>
      ) : null}

      <Link href={`/progress/${exercise.id}`}>View progress</Link>
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  metaPill: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  warmupPill: {
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee",
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  visual: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: "#e7f3ee",
    padding: theme.spacing.md
  },
  visualText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  instructions: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg
  }
});
