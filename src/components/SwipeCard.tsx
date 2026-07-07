import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { theme } from "@/components/theme";
import type { Exercise } from "@/models/exercise";

type SwipeCardProps = {
  exercise: Exercise;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  isAdded?: boolean;
};

export function SwipeCard({
  exercise,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  isAdded = false
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const threshold = 100;

      if (event.translationX > threshold) {
        // Swipe right - add exercise
        translateX.value = withSpring(500, { damping: 20 });
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -threshold) {
        // Swipe left - skip exercise
        translateX.value = withSpring(-500, { damping: 20 });
        runOnJS(onSwipeLeft)();
      } else if (event.translationY < -threshold) {
        // Swipe up - show alternatives
        translateY.value = withSpring(-500, { damping: 20 });
        runOnJS(onSwipeUp)();
      } else {
        // Reset position
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

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
    <GestureDetector gesture={gesture}>
      <View style={[styles.card, animatedStyle]}>
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
      </View>
    </GestureDetector>
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
