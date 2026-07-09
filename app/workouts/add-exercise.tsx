import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { exerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import type { Exercise } from "@/models/exercise";
import { useExercisePickerStore } from "@/state/exercisePickerStore";
import { sampleRandom } from "@/utils/sampleRandom";

const RANDOM_SUGGESTION_COUNT = 10;

export default function AddExerciseScreen() {
  const router = useRouter();
  const excludedExerciseIds = useExercisePickerStore((state) => state.excludedExerciseIds);
  const pick = useExercisePickerStore((state) => state.pick);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let mounted = true;

    exerciseLibraryService
      .getLibraryData()
      .then((data) => {
        if (mounted) {
          setExercises(data.exercises);
        }
      })
      .catch((loadError) => {
        console.error("Exercise library could not be loaded.", loadError);

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

  const excludedSet = useMemo(() => new Set(excludedExerciseIds), [excludedExerciseIds]);

  const eligibleExercises = useMemo(
    () => exercises.filter((exercise) => !excludedSet.has(exercise.id)),
    [exercises, excludedSet]
  );

  const randomSuggestions = useMemo(
    () => sampleRandom(eligibleExercises, RANDOM_SUGGESTION_COUNT),
    [eligibleExercises]
  );

  const isSearching = searchText.trim().length > 0;

  const filteredExercises = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (query.length === 0) {
      return randomSuggestions;
    }

    return eligibleExercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [eligibleExercises, randomSuggestions, searchText]);

  const handlePick = (exercise: Exercise) => {
    pick(exercise.id);
    router.back();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Builder</Text>
        <Text style={styles.title}>Add exercise</Text>
      </View>

      <TextInput
        accessibilityLabel="Search exercises"
        autoFocus
        onChangeText={setSearchText}
        placeholder="Search exercises..."
        placeholderTextColor={theme.colors.muted}
        style={styles.searchInput}
        value={searchText}
      />

      {isLoading ? <LoadingState inline message="Loading exercises" /> : null}

      {error ? <ErrorState message={error} title="Add exercise" /> : null}

      {!isLoading && !isSearching ? (
        <Text style={styles.caption}>Showing {filteredExercises.length} random exercises — search to find a specific one.</Text>
      ) : null}

      {!isLoading && filteredExercises.length === 0 ? (
        <EmptyState
          title="No matching exercises"
          message="Try a different search, or clear it to see all exercises."
        />
      ) : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={filteredExercises}
        initialNumToRender={50}
        keyExtractor={(exercise) => exercise.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: exercise }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${exercise.name}`}
            onPress={() => handlePick(exercise)}
            style={styles.exerciseListItem}
          >
            <Text style={styles.exerciseListItemName}>{exercise.name}</Text>
            <Text style={styles.exerciseListItemMuscle}>{exercise.muscleGroupId}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  caption: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  searchInput: {
    minHeight: 48,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg
  },
  exerciseListItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  exerciseListItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  exerciseListItemMuscle: {
    fontSize: 14,
    color: theme.colors.muted,
    textTransform: "capitalize"
  }
});
