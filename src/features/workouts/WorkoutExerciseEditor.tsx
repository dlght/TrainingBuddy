import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "@/components/theme";
import { createLocalId } from "@/utils/ids";
import { resolveExerciseImage } from "@/features/exercises/exerciseImageResolver";
import { TappableExerciseImage } from "@/features/exercises/TappableExerciseImage";

import { ExerciseLabel } from "@/components/ExerciseLabel";

export type WorkoutExerciseSetPlanValue = {
  key: string;
  reps: string;
  weight: string;
};

export type WorkoutExerciseEditorValue = {
  key: string;
  exerciseId: string;
  exerciseName: string;
  imageUrl: string;
  targetRestSeconds: string;
  setPlans: WorkoutExerciseSetPlanValue[];
};

export function createSetPlanValue(reps = "10", weight = ""): WorkoutExerciseSetPlanValue {
  return { key: createLocalId("set_plan_row"), reps, weight };
}

type WorkoutExerciseEditorProps = {
  exercise: WorkoutExerciseEditorValue;
  index: number;
  errors?: string[];
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isBodyweight?: boolean;
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
  isBodyweight = false,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown
}: WorkoutExerciseEditorProps) {
  const updateRestSeconds = (value: string) => {
    onChange({ ...exercise, targetRestSeconds: value });
  };

  const updateSetPlan = (setIndex: number, field: "reps" | "weight", value: string) => {
    onChange({
      ...exercise,
      setPlans: exercise.setPlans.map((plan, i) => (i === setIndex ? { ...plan, [field]: value } : plan))
    });
  };

  const addSetPlan = () => {
    const last = exercise.setPlans[exercise.setPlans.length - 1];

    onChange({
      ...exercise,
      setPlans: [...exercise.setPlans, createSetPlanValue(last?.reps, last?.weight)]
    });
  };

  const removeSetPlan = (setIndex: number) => {
    if (exercise.setPlans.length <= 1) {
      return;
    }

    onChange({
      ...exercise,
      setPlans: exercise.setPlans.filter((_, i) => i !== setIndex)
    });
  };

  const image = resolveExerciseImage({ imageUrl: exercise.imageUrl });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TappableExerciseImage image={image} label={exercise.exerciseName} thumbnailStyle={styles.thumbnail} />
        <View style={styles.titleBlock}>
          <Text style={styles.order}>{index + 1}</Text>
          <ExerciseLabel name={exercise.exerciseName} style={styles.name} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Remove" onPress={onRemove} style={styles.iconButton}>
          <Ionicons color="#b42318" name="trash-outline" size={20} />
        </Pressable>
      </View>

      <View style={styles.restField}>
        <TargetInput
          accessibilityLabel={`Rest seconds for ${exercise.exerciseName}`}
          keyboardType="number-pad"
          label="Rest between sets (sec)"
          value={exercise.targetRestSeconds}
          onChangeText={updateRestSeconds}
        />
      </View>

      <View style={styles.setPlanList}>
        {exercise.setPlans.map((plan, setIndex) => (
          <View key={plan.key} style={styles.setPlanRow}>
            <Text style={styles.setPlanLabel}>Set {setIndex + 1}</Text>
            <TargetInput
              accessibilityLabel={`Reps for ${exercise.exerciseName} set ${setIndex + 1}`}
              label="Reps"
              value={plan.reps}
              onChangeText={(value) => updateSetPlan(setIndex, "reps", value)}
            />
            {isBodyweight ? null : (
              <TargetInput
                accessibilityLabel={`Weight for ${exercise.exerciseName} set ${setIndex + 1}`}
                keyboardType="decimal-pad"
                label="Weight"
                value={plan.weight}
                onChangeText={(value) => updateSetPlan(setIndex, "weight", value)}
              />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove set ${setIndex + 1}`}
              disabled={exercise.setPlans.length <= 1}
              onPress={() => removeSetPlan(setIndex)}
              style={[styles.iconButton, exercise.setPlans.length <= 1 ? styles.disabled : null]}
            >
              <Ionicons color={theme.colors.muted} name="close" size={18} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        <View style={styles.moveButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Move up"
            disabled={!canMoveUp}
            onPress={onMoveUp}
            style={[styles.iconButton, !canMoveUp ? styles.disabled : null]}
          >
            <Ionicons color={theme.colors.text} name="arrow-up" size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Move down"
            disabled={!canMoveDown}
            onPress={onMoveDown}
            style={[styles.iconButton, !canMoveDown ? styles.disabled : null]}
          >
            <Ionicons color={theme.colors.text} name="arrow-down" size={20} />
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add set" onPress={addSetPlan} style={styles.addSetButton}>
          <Ionicons color={theme.colors.primary} name="add" size={18} />
          <Text style={styles.addSetButtonText}>Add set</Text>
        </Pressable>
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
  onChangeText,
  keyboardType = "number-pad"
}: {
  accessibilityLabel: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "number-pad" | "decimal-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType={keyboardType}
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
  thumbnail: {
    width: 72,
    minHeight: 64,
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee"
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
  restField: {
    maxWidth: 200
  },
  setPlanList: {
    gap: theme.spacing.sm
  },
  setPlanRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm
  },
  setPlanLabel: {
    minWidth: 44,
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "700",
    paddingBottom: 12
  },
  field: {
    minWidth: 72,
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
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    minHeight: 40,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  addSetButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm
  },
  moveButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  iconButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm
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
