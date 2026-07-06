import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { theme } from "@/components/theme";
import type { MuscleGroup, MuscleGroupName } from "@/models/exercise";

import { formatMuscleGroupName } from "./exerciseSelectors";

type MuscleGroupFilterProps = {
  muscleGroups: MuscleGroup[];
  selectedMuscleGroupId: MuscleGroupName | null;
  onSelect: (muscleGroupId: MuscleGroupName) => void;
};

export function MuscleGroupFilter({
  muscleGroups,
  selectedMuscleGroupId,
  onSelect
}: MuscleGroupFilterProps) {
  return (
    <ScrollView
      accessibilityLabel="Muscle groups"
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {muscleGroups.map((group) => {
        const selected = group.id === selectedMuscleGroupId;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={group.id}
            onPress={() => onSelect(group.id)}
            style={({ pressed }) => [
              styles.option,
              selected ? styles.optionSelected : null,
              pressed ? styles.pressed : null
            ]}
          >
            <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>
              {formatMuscleGroupName(group.name)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  option: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  optionTextSelected: {
    color: theme.colors.primaryText
  },
  pressed: {
    opacity: 0.82
  }
});
