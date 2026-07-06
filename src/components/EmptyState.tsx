import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "./theme";

type EmptyStateProps = {
  actions?: ReactNode;
  message: string;
  title: string;
};

export function EmptyState({ actions, message, title }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md
  },
  title: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  message: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs
  }
});
