import { Link, useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/Screen";

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  return (
    <Screen
      eyebrow="Workout detail"
      title="Workout"
      body={`Placeholder detail view for workout: ${workoutId ?? "unknown"}.`}
      actions={<Link href={`/workouts/${workoutId ?? "placeholder"}/session`}>Start session</Link>}
    />
  );
}
