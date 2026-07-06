import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";

import { exercisePlaceholderLabel } from "./exerciseImageResolver";

type ExerciseImageFallbackProps = {
  compact?: boolean;
};

export function ExerciseImageFallback({ compact = false }: ExerciseImageFallbackProps) {
  return (
    <View style={[styles.root, compact ? styles.compact : null]}>
      <Text style={[styles.title, compact ? styles.compactTitle : null]}>{exercisePlaceholderLabel}</Text>
      <Text style={[styles.message, compact ? styles.compactMessage : null]}>
        Local image placeholder
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: "#e7f3ee",
    padding: theme.spacing.md
  },
  compact: {
    width: 72,
    minHeight: 64,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.xs
  },
  title: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  compactTitle: {
    fontSize: 11
  },
  message: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  compactMessage: {
    fontSize: 10
  }
});
