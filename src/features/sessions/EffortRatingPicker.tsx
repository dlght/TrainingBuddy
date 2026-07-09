import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";

import { RATING_OPTIONS, type EffortRatingValue } from "./effortRating";

type EffortRatingPickerProps = {
  selectedRating: EffortRatingValue | null;
  onSelect: (rating: EffortRatingValue) => void;
};

export function EffortRatingPicker({ selectedRating, onSelect }: EffortRatingPickerProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>How was it?</Text>
      <View style={styles.row}>
        {RATING_OPTIONS.map((option) => {
          const isSelected = selectedRating === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`Rate effort ${option.value}: ${option.label}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(option.value)}
              style={[styles.option, isSelected ? styles.optionSelected : null]}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>
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
  card: {
    gap: theme.spacing.sm,
    alignItems: "center"
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.xs
  },
  option: {
    width: 68,
    alignItems: "center",
    gap: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 4
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "#e9f7f1"
  },
  optionEmoji: {
    fontSize: 20
  },
  optionLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center"
  },
  optionLabelSelected: {
    color: theme.colors.primary
  }
});
