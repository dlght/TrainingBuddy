import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import type { Exercise } from "@/models/exercise";

import { ExerciseImageFallback } from "./ExerciseImageFallback";
import { resolveExerciseImage } from "./exerciseImageResolver";
import { formatMuscleGroupName } from "./exerciseSelectors";

type ExerciseCardProps = {
  accessibilityLabel?: string;
  exercise: Exercise;
  onPress?: (exercise: Exercise) => void;
};

export function ExerciseCard({ accessibilityLabel, exercise, onPress }: ExerciseCardProps) {
  const image = resolveExerciseImage(exercise);
  const equipment = exercise.equipment ?? "No equipment";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? "button" : undefined}
      onPress={() => onPress?.(exercise)}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      {image.kind === "placeholder" ? (
        <ExerciseImageFallback compact />
      ) : (
        <View style={styles.visual}>
          <Text style={styles.visualText}>Exercise image</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{exercise.name}</Text>
          {exercise.isWarmup ? <Text style={styles.badge}>Warmup</Text> : null}
        </View>
        <Text style={styles.meta}>
          {formatMuscleGroupName(exercise.muscleGroupId)} - {equipment}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    flexDirection: "row",
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md
  },
  visual: {
    width: 72,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee",
    padding: theme.spacing.xs
  },
  visualText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
    justifyContent: "center"
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    alignItems: "center"
  },
  name: {
    flexShrink: 1,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  badge: {
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee",
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  pressed: {
    opacity: 0.82
  }
});
