import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "@/components/theme";

import { formatRestTime } from "./useRestTimer";
import { validateRestSeconds } from "./sessionValidation";

type RestTimerControlsProps = {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  onDurationChange: (seconds: number) => void;
  onStart: () => void;
  onSkip: () => void;
};

export function RestTimerControls({
  durationSeconds,
  remainingSeconds,
  isRunning,
  onDurationChange,
  onStart,
  onSkip
}: RestTimerControlsProps) {
  const [durationText, setDurationText] = useState(String(durationSeconds));
  const [error, setError] = useState<string | null>(null);

  const updateDuration = (value: string) => {
    setDurationText(value);
    const result = validateRestSeconds(value);

    if (!result.isValid || result.value === undefined) {
      setError(result.errors.restSeconds ?? "Rest is invalid.");
      return;
    }

    setError(null);
    onDurationChange(result.value);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Rest timer</Text>
        <Text style={styles.timerText}>Rest {formatRestTime(remainingSeconds)}</Text>
      </View>
      <Text style={styles.status}>{isRunning ? "Rest running" : "Rest ready"}</Text>
      <View style={styles.controls}>
        <View style={styles.field}>
          <Text style={styles.label}>Seconds</Text>
          <TextInput
            accessibilityLabel="Rest seconds"
            keyboardType="number-pad"
            onChangeText={updateDuration}
            style={[styles.input, error ? styles.inputError : null]}
            value={durationText}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={onStart} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Start rest</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Skip rest</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  timerText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "800"
  },
  status: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: "700"
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  field: {
    minWidth: 96,
    gap: theme.spacing.xs
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  input: {
    minHeight: 42,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.sm
  },
  inputError: {
    borderColor: "#b42318"
  },
  secondaryButton: {
    minHeight: 42,
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
  error: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "700"
  }
});
