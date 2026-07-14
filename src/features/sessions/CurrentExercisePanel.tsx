import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import type { SetLog } from "@/models/session";

import { resolveExerciseImage } from "@/features/exercises/exerciseImageResolver";
import { TappableExerciseImage } from "@/features/exercises/TappableExerciseImage";
import { formatRepRange } from "@/features/workouts/repRangeFormat";

import { SetProgressDots } from "./SetProgressDots";
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
  const image = resolveExerciseImage({ imageUrl: exercise.imageUrl });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TappableExerciseImage image={image} label={exercise.exerciseName} thumbnailStyle={styles.thumbnail} />
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>
            Exercise {exerciseIndex + 1} of {exerciseCount}
          </Text>
          <Text style={styles.title}>{exercise.exerciseName}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        Target {exercise.targetSets} sets - {formatRepRange(exercise.targetRepRangeLow, exercise.targetRepRangeHigh)}{" "}
        reps - {exercise.targetRestSeconds}s target rest
      </Text>
      <SetProgressDots completed={exerciseSetLogs.length} total={exercise.targetSets} />

      {exerciseSetLogs.length > 0 ? (
        <View style={styles.loggedSets}>
          {exerciseSetLogs.map((setLog) => (
            <View key={setLog.id} style={styles.loggedSetRow}>
              <View style={styles.loggedSetBadge}>
                <Text style={styles.loggedSetBadgeText}>{setLog.setNumber}</Text>
              </View>
              <Text style={styles.loggedSetReps}>{setLog.reps} reps</Text>
              {setLog.weight !== null ? <Text style={styles.loggedSetWeight}>{setLog.weight}</Text> : null}
            </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  thumbnail: {
    width: 72,
    minHeight: 64,
    borderRadius: theme.radius.sm,
    backgroundColor: "#e7f3ee"
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs
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
  loggedSetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  loggedSetBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary
  },
  loggedSetBadgeText: {
    color: theme.colors.primaryText,
    fontSize: 13,
    fontWeight: "800"
  },
  loggedSetReps: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  loggedSetWeight: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: "600"
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
