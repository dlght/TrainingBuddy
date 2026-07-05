import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/Screen";

export default function ActiveSessionScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  return (
    <Screen
      eyebrow="Active session"
      title="Log workout"
      body={`Placeholder session flow for workout: ${workoutId ?? "unknown"}.`}
    />
  );
}
