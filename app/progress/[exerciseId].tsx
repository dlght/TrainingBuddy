import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/Screen";

export default function ProgressScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  return (
    <Screen
      eyebrow="Progress"
      title="Exercise progress"
      body={`Placeholder progress view for exercise: ${exerciseId ?? "unknown"}.`}
    />
  );
}
