import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import type { SetLog } from "@/models/session";

import type { ActiveSessionExercise } from "./sessionService";

type CurrentExercisePanelProps = {
  exercise: ActiveSessionExercise;
  exerciseIndex: number;
  exerciseCount: number;
  setLogs: SetLog[];
  onPrevious: () => void;
  onNext: () => void;
};

export function CurrentExercisePanel({
  exercise,
  exerciseIndex,
  exerciseCount,
  setLogs,
  onPrevious,
  onNext
}: CurrentExercisePanelProps) {
  const exerciseSetLogs = setLogs.filter((setLog) => setLog.workoutExerciseId === exercise.id);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>
        Exercise {exerciseIndex + 1} of {exerciseCount}
      </Text>
      <Text style={styles.title}>{exercise.exerciseName}</Text>
      <Text style={styles.meta}>
        Target {exercise.targetSets} sets - {exercise.targetRepRangeLow}-{exercise.targetRepRangeHigh} reps -{" "}
        {exercise.targetRestSeconds}s target rest
      </Text>
      <Text style={styles.meta}>
        Logged {exerciseSetLogs.length} of {exercise.targetSets} planned sets
      </Text>

      {exerciseSetLogs.length > 0 ? (
        <View style={styles.loggedSets}>
          {exerciseSetLogs.map((setLog) => (
            <Text key={setLog.id} style={styles.loggedSet}>
              Set {setLog.setNumber}: {setLog.reps} reps, {setLog.weight} weight, RPE {setLog.effortRpe}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          disabled={exerciseIndex === 0}
          onPress={onPrevious}
          style={[styles.secondaryButton, exerciseIndex === 0 ? styles.disabled : null]}
        >
          <Text style={styles.secondaryButtonText}>Previous</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={exerciseIndex >= exerciseCount - 1}
          onPress={onNext}
          style={[styles.secondaryButton, exerciseIndex >= exerciseCount - 1 ? styles.disabled : null]}
        >
          <Text style={styles.secondaryButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
    padding: theme.spacing.md
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800"
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  loggedSets: {
    gap: theme.spacing.xs
  },
  loggedSet: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  navRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  secondaryButton: {
    minHeight: 42,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.45
  }
});
