import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, type ImageStyle, type StyleProp } from "react-native";

import { theme } from "@/components/theme";

import { ExerciseImageFallback } from "./ExerciseImageFallback";
import type { ResolvedExerciseImage } from "./exerciseImageResolver";

type TappableExerciseImageProps = {
  image: ResolvedExerciseImage;
  label: string;
  thumbnailStyle: StyleProp<ImageStyle>;
  fallbackCompact?: boolean;
};

export function TappableExerciseImage({
  image,
  label,
  thumbnailStyle,
  fallbackCompact = true
}: TappableExerciseImageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (image.kind !== "remote") {
    return <ExerciseImageFallback compact={fallbackCompact} />;
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View larger photo of ${label}`}
        onPress={() => setIsExpanded(true)}
      >
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={{ uri: image.uri }}
          style={thumbnailStyle}
        />
      </Pressable>
      {isExpanded ? (
        <Modal animationType="fade" onRequestClose={() => setIsExpanded(false)} transparent visible>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            onPress={() => setIsExpanded(false)}
            style={styles.backdrop}
          >
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={{ uri: image.uri }}
              style={styles.expandedImage}
            />
            <Text style={styles.closeHint}>Tap anywhere to close</Text>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  expandedImage: {
    width: "100%",
    height: "80%"
  },
  closeHint: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600"
  }
});
