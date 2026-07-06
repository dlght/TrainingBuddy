import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import { ExerciseCard } from "@/features/exercises/ExerciseCard";
import type { Exercise } from "@/models/exercise";

type ExercisePickerProps = {
  exercises: Exercise[];
  selectedExerciseIds?: string[];
  onAddExercise: (exercise: Exercise) => void;
};

export function ExercisePicker({
  exercises,
  selectedExerciseIds = [],
  onAddExercise
}: ExercisePickerProps) {
  const selectedIds = new Set(selectedExerciseIds);

  return (
    <View style={styles.root}>
      <Text style={styles.sectionTitle}>Add exercise</Text>
      <View style={styles.list}>
        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseRow}>
            <ExerciseCard
              accessibilityLabel={`Add ${exercise.name}`}
              exercise={exercise}
              onPress={onAddExercise}
            />
            {selectedIds.has(exercise.id) ? <Text style={styles.addedText}>Added</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  list: {
    gap: theme.spacing.sm
  },
  exerciseRow: {
    gap: theme.spacing.xs
  },
  addedText: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee",
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  }
});
