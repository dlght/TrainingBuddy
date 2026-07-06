import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "./theme";

type LoadingStateProps = {
  inline?: boolean;
  message?: string;
  title?: string;
};

export function LoadingState({ inline = false, message = "Loading", title }: LoadingStateProps) {
  return (
    <View style={[styles.root, inline ? styles.inline : styles.full]}>
      <ActivityIndicator color={theme.colors.primary} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg
  },
  full: {
    flex: 1
  },
  inline: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center"
  },
  message: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center"
  }
});
