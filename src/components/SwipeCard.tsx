import { useRef } from "react";
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import type { Exercise } from "@/models/exercise";

type SwipeCardProps = {
  exercise: Exercise;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  isAdded?: boolean;
};

const SWIPE_THRESHOLD = 100;

export function SwipeCard({
  exercise,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  isAdded = false
}: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
  };

  const flyOut = (toValue: { x: number; y: number }, callback: () => void) => {
    Animated.timing(position, { toValue, duration: 200, useNativeDriver: true }).start(() => {
      position.setValue({ x: 0, y: 0 });
      callback();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: true
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          flyOut({ x: 500, y: gestureState.dy }, onSwipeRight);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          flyOut({ x: -500, y: gestureState.dy }, onSwipeLeft);
        } else if (gestureState.dy < -SWIPE_THRESHOLD) {
          flyOut({ x: gestureState.dx, y: -500 }, onSwipeUp);
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const animatedStyle = {
    transform: position.getTranslateTransform()
  };

  const muscleGroupColors: Record<string, string> = {
    chest: "#e74c3c",
    back: "#3498db",
    legs: "#2ecc71",
    shoulders: "#e67e22",
    arms: "#9b59b6",
    core: "#f1c40f"
  };

  const muscleGroupColor = muscleGroupColors[exercise.muscleGroupId] || "#95a5a6";

  return (
    <Animated.View style={[styles.card, animatedStyle]} {...panResponder.panHandlers}>
      <Image
        source={{ uri: exercise.imageUrl }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{exercise.name}</Text>
        <View style={[styles.muscleGroupTag, { backgroundColor: muscleGroupColor }]}>
          <Text style={styles.muscleGroupText}>{exercise.muscleGroupId}</Text>
        </View>
        {isAdded && (
          <View style={styles.addedBadge}>
            <Text style={styles.addedText}>Added</Text>
          </View>
        )}
      </View>
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, styles.skipButton]}
          onPress={onSwipeLeft}
          accessibilityLabel="Skip exercise"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>Skip</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.addButton]}
          onPress={onSwipeRight}
          accessibilityLabel="Add exercise"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>Add</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.alternativesButton]}
          onPress={onSwipeUp}
          accessibilityLabel="Show alternatives"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>Alternatives</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  image: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
    backgroundColor: "#f0f0f0"
  },
  content: {
    padding: theme.spacing.md,
    position: "relative"
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  muscleGroupTag: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm
  },
  muscleGroupText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    textTransform: "capitalize"
  },
  addedBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: "#e7f3ee",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm
  },
  addedText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: theme.spacing.md,
    gap: theme.spacing.sm
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  skipButton: {
    backgroundColor: "#f3f6fb"
  },
  addButton: {
    backgroundColor: theme.colors.primary
  },
  alternativesButton: {
    backgroundColor: "#f3f6fb"
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text
  }
});
