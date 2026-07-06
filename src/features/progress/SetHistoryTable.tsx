import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import type { ExerciseHistorySet } from "@/models/session";

import { formatShortDate } from "./progressCalculations";

type SetHistoryTableProps = {
  sets: ExerciseHistorySet[];
};

export function SetHistoryTable({ sets }: SetHistoryTableProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Set history</Text>
      {sets.length === 0 ? <Text style={styles.emptyText}>Completed sets will appear here.</Text> : null}
      {sets.map((set) => (
        <View key={`${set.sessionId}-${set.setNumber}-${set.completedAt}`} style={styles.row}>
          <View style={styles.primaryCell}>
            <Text style={styles.setNumber}>Set {set.setNumber}</Text>
            <Text style={styles.meta}>
              {formatShortDate(set.completedAt)} - {set.workoutNameSnapshot}
            </Text>
          </View>
          <Text style={styles.value}>{set.reps} reps</Text>
          <Text style={styles.value}>{set.weight}</Text>
          <Text style={styles.value}>RPE {set.effortRpe}</Text>
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
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md
  },
  primaryCell: {
    flex: 1,
    gap: theme.spacing.xs
  },
  setNumber: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  value: {
    minWidth: 48,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right"
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  }
});
