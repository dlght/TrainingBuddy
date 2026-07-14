import { StyleSheet, View } from "react-native";

import { theme } from "@/components/theme";

type SetProgressDotsProps = {
  completed: number;
  total: number;
};

export function SetProgressDots({ completed, total }: SetProgressDotsProps) {
  const dots = Array.from({ length: total }, (_, index) => index < completed);

  return (
    <View accessibilityLabel={`${completed} of ${total} sets logged`} style={styles.row}>
      {dots.map((isFilled, index) => (
        <View key={index} style={[styles.dot, isFilled ? styles.filled : styles.empty]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  filled: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  empty: {
    backgroundColor: theme.colors.surface
  }
});
