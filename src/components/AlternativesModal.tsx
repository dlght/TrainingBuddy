import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import type { Exercise } from "@/models/exercise";

type AlternativesModalProps = {
  visible: boolean;
  alternatives: Exercise[];
  onSelectAlternative: (exercise: Exercise) => void;
  onClose: () => void;
};

export function AlternativesModal({
  visible,
  alternatives,
  onSelectAlternative,
  onClose
}: AlternativesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Alternatives</Text>
          <View style={styles.alternativesList}>
            {alternatives.map((exercise) => (
              <Pressable
                key={exercise.id}
                style={styles.alternativeItem}
                onPress={() => onSelectAlternative(exercise)}
                accessibilityLabel={`Select ${exercise.name}`}
                accessibilityRole="button"
              >
                <Text style={styles.alternativeName}>{exercise.name}</Text>
                <Text style={styles.alternativeMuscleGroup}>
                  {exercise.muscleGroupId}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close alternatives"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    width: "100%",
    maxWidth: 400
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  alternativesList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  alternativeItem: {
    padding: theme.spacing.md,
    backgroundColor: "#f3f6fb",
    borderRadius: theme.radius.sm
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  alternativeMuscleGroup: {
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: "capitalize"
  },
  closeButton: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    alignItems: "center"
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryText
  }
});
