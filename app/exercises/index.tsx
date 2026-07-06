import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { ExerciseCard } from "@/features/exercises/ExerciseCard";
import { exerciseLibraryService, type ExerciseLibraryData } from "@/features/exercises/exerciseLibraryService";
import {
  getExercisesForMuscleGroup,
  type GroupedExercises
} from "@/features/exercises/exerciseSelectors";
import { MuscleGroupFilter } from "@/features/exercises/MuscleGroupFilter";
import type { Exercise, MuscleGroupName } from "@/models/exercise";

function getSelectedGroup(
  groupedExercises: GroupedExercises[],
  selectedMuscleGroupId: MuscleGroupName | null
): GroupedExercises | null {
  return (
    groupedExercises.find((group) => group.muscleGroup.id === selectedMuscleGroupId) ??
    groupedExercises[0] ??
    null
  );
}

export default function ExerciseLibraryScreen() {
  const [libraryData, setLibraryData] = useState<ExerciseLibraryData | null>(null);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<MuscleGroupName | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    exerciseLibraryService
      .getLibraryData()
      .then((data) => {
        if (!mounted) {
          return;
        }

        setLibraryData(data);
        setSelectedMuscleGroupId(data.defaultMuscleGroupId);
      })
      .catch(() => {
        if (mounted) {
          setError("Exercise library could not be loaded.");
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

  const selectedExercises = useMemo<Exercise[]>(() => {
    if (!libraryData || !selectedMuscleGroupId) {
      return [];
    }

    const selectedGroup = getSelectedGroup(libraryData.groupedExercises, selectedMuscleGroupId);

    return selectedGroup?.exercises ?? getExercisesForMuscleGroup(libraryData.exercises, selectedMuscleGroupId);
  }, [libraryData, selectedMuscleGroupId]);

  if (isLoading) {
    return <LoadingState message="Loading exercises" title="Exercise library" />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorState message={error} title="Exercise library" />
      </View>
    );
  }

  if (!libraryData || libraryData.exercises.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          title="Exercise library"
          message="No seeded exercises are available yet. Restart the app to run the local seed loader."
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Exercises</Text>
        <Text style={styles.title}>Exercise library</Text>
        <Text style={styles.body}>
          Browse beginner-friendly seeded exercises by muscle group.
        </Text>
      </View>

      <MuscleGroupFilter
        muscleGroups={libraryData.muscleGroups}
        selectedMuscleGroupId={selectedMuscleGroupId}
        onSelect={setSelectedMuscleGroupId}
      />

      <View style={styles.list}>
        {selectedExercises.map((exercise) => (
          <Link asChild href={`/exercises/${exercise.id}`} key={exercise.id}>
            <ExerciseCard exercise={exercise} />
          </Link>
        ))}
      </View>
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
  list: {
    gap: theme.spacing.md
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
