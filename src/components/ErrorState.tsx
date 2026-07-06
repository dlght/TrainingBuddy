import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "./theme";

type ErrorStateProps = {
  actions?: ReactNode;
  message: string;
  title?: string;
};

export function ErrorState({ actions, message, title = "Something went wrong" }: ErrorStateProps) {
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
    borderColor: "#fecdca",
    backgroundColor: "#fef3f2",
    padding: theme.spacing.md
  },
  title: {
    color: "#912018",
    fontSize: 17,
    fontWeight: "800"
  },
  message: {
    color: "#b42318",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22
  },
  actions: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs
  }
});
