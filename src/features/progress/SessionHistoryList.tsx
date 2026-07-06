import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";

import { formatShortDate, type SessionHistorySummary } from "./progressCalculations";

type SessionHistoryListProps = {
  sessions: SessionHistorySummary[];
};

export function SessionHistoryList({ sessions }: SessionHistoryListProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Session history</Text>
      {sessions.length === 0 ? <Text style={styles.emptyText}>No completed sessions yet.</Text> : null}
      {sessions.map((session) => (
        <View key={session.sessionId} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.workoutName}>{session.workoutNameSnapshot}</Text>
            <Text style={styles.meta}>
              {formatShortDate(session.completedAt)} - {session.setCount}{" "}
              {session.setCount === 1 ? "set" : "sets"}
            </Text>
          </View>
          <Text style={styles.volume}>{session.totalVolume} volume</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md
  },
  rowText: {
    flex: 1,
    gap: theme.spacing.xs
  },
  workoutName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  volume: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  }
});
