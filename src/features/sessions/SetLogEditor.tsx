import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "@/components/theme";

import {
  validateSetLogValues,
  type SetLogValidationErrors
} from "./sessionValidation";

export type SetLogEditorValues = {
  reps: string;
  weight: string;
};

type SetLogEditorProps = {
  isSaving?: boolean;
  onSubmit: (values: SetLogEditorValues) => Promise<void> | void;
};

export function SetLogEditor({ isSaving = false, onSubmit }: SetLogEditorProps) {
  const [values, setValues] = useState<SetLogEditorValues>({
    reps: "",
    weight: "",
  });
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
    const result = validateSetLogValues(values);

    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(values);
    setValues({
      reps: "",
      weight: values.weight
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
        <Field
          accessibilityLabel="Weight"
          error={errors.weight}
          label="Weight"
          value={values.weight}
          onChangeText={(value) => setField("weight", value)}
        />
      </View>
      <Pressable
        accessibilityLabel="Submit set log"
        accessibilityRole="button"
        disabled={isSaving}
        onPress={submit}
        style={[styles.primaryButton, isSaving ? styles.disabled : null]}
      >
        {isSaving ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text style={styles.primaryButtonText}>Log set</Text>
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
  inputError: {
    borderColor: "#b42318"
  },
  error: {
    color: "#b42318",
    fontSize: 12,
    fontWeight: "700"
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
