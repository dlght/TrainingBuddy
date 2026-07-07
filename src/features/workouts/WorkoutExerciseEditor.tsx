import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "@/components/theme";

import { SupersetGroupControl } from "./SupersetGroupControl";
import { ExerciseLabel } from "@/components/ExerciseLabel";

export type WorkoutExerciseEditorValue = {
  key: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: string;
  targetReps: string;
  targetRestSeconds: string;
  supersetGroupId: string | null;
};

type WorkoutExerciseEditorProps = {
  exercise: WorkoutExerciseEditorValue;
  index: number;
  errors?: string[];
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onChange: (exercise: WorkoutExerciseEditorValue) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function WorkoutExerciseEditor({
  exercise,
  index,
  errors = [],
  canMoveUp = true,
  canMoveDown = true,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown
}: WorkoutExerciseEditorProps) {
  const setField = (
    field: keyof Pick<
      WorkoutExerciseEditorValue,
      "targetSets" | "targetReps" | "targetRestSeconds" | "supersetGroupId"
    >,
    value: string | null
  ) => {
    onChange({
      ...exercise,
      [field]: value
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.order}>{index + 1}</Text>
          <ExerciseLabel name={exercise.exerciseName} style={styles.name} />
        </View>
        <Pressable accessibilityRole="button" onPress={onRemove} style={styles.textButton}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>

      <View style={styles.fields}>
        <TargetInput
          accessibilityLabel={`Sets for ${exercise.exerciseName}`}
          label="Sets"
          value={exercise.targetSets}
          onChangeText={(value) => setField("targetSets", value)}
        />
        <TargetInput
          accessibilityLabel={`Reps for ${exercise.exerciseName}`}
          label="Reps"
          value={exercise.targetReps}
          onChangeText={(value) => setField("targetReps", value)}
        />
        <TargetInput
          accessibilityLabel={`Rest seconds for ${exercise.exerciseName}`}
          label="Rest"
          value={exercise.targetRestSeconds}
          onChangeText={(value) => setField("targetRestSeconds", value)}
        />
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          disabled={!canMoveUp}
          onPress={onMoveUp}
          style={[styles.smallButton, !canMoveUp ? styles.disabled : null]}
        >
          <Text style={styles.smallButtonText}>Up</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!canMoveDown}
          onPress={onMoveDown}
          style={[styles.smallButton, !canMoveDown ? styles.disabled : null]}
        >
          <Text style={styles.smallButtonText}>Down</Text>
        </Pressable>
        <SupersetGroupControl
          isInSuperset={exercise.supersetGroupId === "superset-a"}
          onToggle={() =>
            setField("supersetGroupId", exercise.supersetGroupId === "superset-a" ? null : "superset-a")
          }
        />
      </View>

      {errors.map((error) => (
        <Text key={error} style={styles.error}>
          {error}
        </Text>
      ))}
    </View>
  );
}

function TargetInput({
  accessibilityLabel,
  label,
  value,
  onChangeText
}: {
  accessibilityLabel: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType="number-pad"
        onChangeText={onChangeText}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
    padding: theme.spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  titleBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  order: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee",
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 28,
    textAlign: "center"
  },
  name: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  textButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  removeText: {
    color: "#b42318",
    fontSize: 14,
    fontWeight: "800"
  },
  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  field: {
    minWidth: 90,
    flex: 1,
    gap: theme.spacing.xs
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  input: {
    minHeight: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.sm
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  smallButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md
  },
  smallButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.45
  },
  error: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "700"
  }
});
