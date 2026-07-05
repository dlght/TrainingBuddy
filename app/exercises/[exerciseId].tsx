import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/Screen";

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  return (
    <Screen
      eyebrow="Exercise detail"
      title="Exercise"
      body={`Placeholder detail view for exercise: ${exerciseId ?? "unknown"}.`}
    />
  );
}
