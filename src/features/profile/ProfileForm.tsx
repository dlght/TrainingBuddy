import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { theme } from "@/components/theme";
import type { UserProfile } from "@/models/user";
import { useProfileSetupStore } from "@/state/profileSetupStore";

import {
  experienceLevelOptions,
  goalOptions,
  type ProfileFormValues,
  validateProfile
} from "./profileValidation";

type ProfileFormProps = {
  initialProfile?: UserProfile | null;
  isSaving?: boolean;
  submitLabel?: string;
  onSubmit: (values: ProfileFormValues) => Promise<void> | void;
};

type FieldKey = keyof ProfileFormValues;

function fieldLabel(field: FieldKey): string {
  switch (field) {
    case "name":
      return "Name";
    case "bodyweight":
      return "Bodyweight";
    case "height":
      return "Height";
    case "weightUnit":
      return "Unit";
    case "experienceLevel":
      return "Experience";
    case "goal":
      return "Goal";
  }
}

function hasEnteredDraftValues(draft: ProfileFormValues): boolean {
  return (
    draft.name.trim().length > 0 ||
    draft.bodyweight.trim().length > 0 ||
    draft.height.trim().length > 0 ||
    draft.weightUnit !== "kg" ||
    draft.experienceLevel !== "new" ||
    draft.goal !== "Build consistency"
  );
}

export function ProfileForm({
  initialProfile = null,
  isSaving = false,
  submitLabel = "Save profile",
  onSubmit
}: ProfileFormProps) {
  const draft = useProfileSetupStore((state) => state.draft);
  const updateDraft = useProfileSetupStore((state) => state.updateDraft);
  const hydrateFromProfile = useProfileSetupStore((state) => state.hydrateFromProfile);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [hasResumedDraft] = useState(() => initialProfile === null && hasEnteredDraftValues(draft));

  useEffect(() => {
    if (initialProfile) {
      hydrateFromProfile(initialProfile);
    }
  }, [hydrateFromProfile, initialProfile]);

  const setField = (field: FieldKey, value: string) => {
    updateDraft(field, value);
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    const result = validateProfile(draft);

    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(draft);
  };

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>Create your profile</Text>
        <Text style={styles.body}>Set the basics TrainingBuddy uses for workouts and progress.</Text>
      </View>

      {initialProfile ? null : hasResumedDraft ? (
        <EmptyState
          title="Setup draft restored"
          message="Your in-progress profile details are still here. Review them, then save when ready."
        />
      ) : (
        <EmptyState
          title="Profile not saved yet"
          message="Add your basics once, then TrainingBuddy keeps them locally for workouts and history."
        />
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{fieldLabel("name")}</Text>
        <TextInput
          accessibilityLabel="Name"
          autoCapitalize="words"
          onChangeText={(value) => setField("name", value)}
          placeholder="Alex"
          style={[styles.input, errors.name ? styles.inputError : null]}
          value={draft.name}
        />
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
      </View>

      <View style={styles.row}>
        <View style={styles.rowField}>
          <Text style={styles.label}>{fieldLabel("bodyweight")}</Text>
          <TextInput
            accessibilityLabel="Bodyweight"
            keyboardType="decimal-pad"
            onChangeText={(value) => setField("bodyweight", value)}
            placeholder="75"
            style={[styles.input, errors.bodyweight ? styles.inputError : null]}
            value={draft.bodyweight}
          />
          {errors.bodyweight ? <Text style={styles.error}>{errors.bodyweight}</Text> : null}
        </View>

        <View style={styles.rowField}>
          <Text style={styles.label}>{fieldLabel("height")}</Text>
          <TextInput
            accessibilityLabel="Height"
            keyboardType="decimal-pad"
            onChangeText={(value) => setField("height", value)}
            placeholder="178"
            style={[styles.input, errors.height ? styles.inputError : null]}
            value={draft.height}
          />
          {errors.height ? <Text style={styles.error}>{errors.height}</Text> : null}
        </View>
      </View>

      <SegmentedControl
        label={fieldLabel("weightUnit")}
        options={[
          { label: "kg", value: "kg" },
          { label: "lb", value: "lb" }
        ]}
        selectedValue={draft.weightUnit}
        onSelect={(value) => setField("weightUnit", value)}
      />
      {errors.weightUnit ? <Text style={styles.error}>{errors.weightUnit}</Text> : null}

      <SegmentedControl
        label={fieldLabel("experienceLevel")}
        options={experienceLevelOptions}
        selectedValue={draft.experienceLevel}
        onSelect={(value) => setField("experienceLevel", value)}
      />
      {errors.experienceLevel ? <Text style={styles.error}>{errors.experienceLevel}</Text> : null}

      <SegmentedControl
        label={fieldLabel("goal")}
        options={goalOptions.map((goal) => ({ label: goal, value: goal }))}
        selectedValue={draft.goal}
        onSelect={(value) => setField("goal", value)}
      />
      {errors.goal ? <Text style={styles.error}>{errors.goal}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          pressed && !isSaving ? styles.pressed : null,
          isSaving ? styles.disabledButton : null
        ]}
      >
        {isSaving ? <ActivityIndicator color={theme.colors.primaryText} /> : <Text style={styles.submitText}>{submitLabel}</Text>}
      </Pressable>
    </ScrollView>
  );
}

function SegmentedControl<TValue extends string>({
  label,
  options,
  selectedValue,
  onSelect
}: {
  label: string;
  options: { label: string; value: TValue }[];
  selectedValue: string;
  onSelect: (value: TValue) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentRow}>
        {options.map((option) => {
          const selected = option.value === selectedValue;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [
                styles.segment,
                selected ? styles.segmentSelected : null,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  header: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm
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
  body: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 23
  },
  fieldGroup: {
    gap: theme.spacing.sm
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md
  },
  inputError: {
    borderColor: "#b42318"
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  rowField: {
    flex: 1,
    gap: theme.spacing.sm
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  segment: {
    minHeight: 40,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md
  },
  segmentSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary
  },
  segmentText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  segmentTextSelected: {
    color: theme.colors.primaryText
  },
  error: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "600"
  },
  submitButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md
  },
  disabledButton: {
    opacity: 0.7
  },
  pressed: {
    opacity: 0.82
  },
  submitText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: "800"
  }
});
