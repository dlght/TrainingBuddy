import { Pressable, StyleSheet, Text } from "react-native";

import { theme } from "@/components/theme";

type SupersetGroupControlProps = {
  isInSuperset: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function SupersetGroupControl({
  isInSuperset,
  disabled = false,
  onToggle
}: SupersetGroupControlProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: isInSuperset, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.control,
        isInSuperset ? styles.controlSelected : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null
      ]}
    >
      <Text style={[styles.controlText, isInSuperset ? styles.controlTextSelected : null]}>
        {isInSuperset ? "Superset A" : "Superset"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md
  },
  controlSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary
  },
  controlText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  controlTextSelected: {
    color: theme.colors.primaryText
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    opacity: 0.82
  }
});
