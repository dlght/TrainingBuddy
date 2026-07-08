import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "@/components/theme";

import {
  validateSetLogValues,
  type SetLogValidationErrors
} from "./sessionValidation";
import { formatRestTime } from "./useRestTimer";

export type SetLogEditorValues = {
  reps: string;
  weight: string;
};

type SetLogEditorProps = {
  isSaving?: boolean;
  isBodyweight?: boolean;
  isResting?: boolean;
  restRemainingSeconds?: number;
  defaultReps?: number | null;
  defaultWeight?: number | null;
  onSkipRest?: () => void;
  onSubmit: (values: SetLogEditorValues) => Promise<void> | void;
};

function defaultValues(defaultReps: number | null, defaultWeight: number | null): SetLogEditorValues {
  return {
    reps: defaultReps !== null && defaultReps !== undefined ? String(defaultReps) : "",
    weight: defaultWeight !== null && defaultWeight !== undefined ? String(defaultWeight) : ""
  };
}

export function SetLogEditor({
  isSaving = false,
  isBodyweight = false,
  isResting = false,
  restRemainingSeconds = 0,
  defaultReps = null,
  defaultWeight = null,
  onSkipRest,
  onSubmit
}: SetLogEditorProps) {
  const [values, setValues] = useState<SetLogEditorValues>(() => defaultValues(defaultReps, defaultWeight));
  const [errors, setErrors] = useState<SetLogValidationErrors>({});

  const setField = (field: keyof SetLogEditorValues, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async () => {
    const result = validateSetLogValues(values, isBodyweight);

    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(values);
    setValues((current) => {
      const next = defaultValues(defaultReps, defaultWeight);

      return {
        reps: next.reps,
        weight: defaultWeight !== null ? next.weight : current.weight
      };
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Log set</Text>
      <View style={styles.fields}>
        <Field
          accessibilityLabel="Reps"
          error={errors.reps}
          label="Reps"
          value={values.reps}
          onChangeText={(value) => setField("reps", value)}
        />
        {isBodyweight ? null : (
          <Field
            accessibilityLabel="Weight"
            error={errors.weight}
            label="Weight"
            value={values.weight}
            onChangeText={(value) => setField("weight", value)}
          />
        )}
      </View>
      <View style={styles.restRow}>
        <Text style={styles.restText}>Rest {formatRestTime(restRemainingSeconds)}</Text>
        <Pressable
          accessibilityLabel="Skip rest"
          accessibilityRole="button"
          disabled={!isResting}
          onPress={onSkipRest}
          style={[styles.skipButton, !isResting ? styles.skipButtonDisabled : null]}
        >
          <Text style={[styles.skipButtonText, !isResting ? styles.skipButtonTextDisabled : null]}>Skip rest</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel="Submit set log"
        accessibilityRole="button"
        disabled={isSaving || isResting}
        onPress={submit}
        style={[styles.primaryButton, isSaving || isResting ? styles.disabled : null]}
      >
        {isSaving ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text style={styles.primaryButtonText}>{isResting ? "Resting…" : "Log set"}</Text>
        )}
      </Pressable>
    </View>
  );
}

function Field({
  accessibilityLabel,
  error,
  label,
  value,
  onChangeText
}: {
  accessibilityLabel: string;
  error?: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType="decimal-pad"
        onChangeText={onChangeText}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
      />
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
    gap: theme.spacing.md,
    padding: theme.spacing.md
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  field: {
    minWidth: 90,
    flexGrow: 0,
    flexBasis: "48%",
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
  inputError: {
    borderColor: "#b42318"
  },
  error: {
    color: "#b42318",
    fontSize: 12,
    fontWeight: "700"
  },
  restRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  restText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  skipButton: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md
  },
  skipButtonDisabled: {
    opacity: 0.4
  },
  skipButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  skipButtonTextDisabled: {
    color: theme.colors.muted
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.65
  }
});
