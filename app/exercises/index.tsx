import { Link } from "expo-router";

import { Screen } from "@/components/Screen";

export default function ExerciseLibraryScreen() {
  return (
    <Screen
      eyebrow="Exercises"
      title="Exercise library"
      body="This placeholder will show seeded exercises grouped by muscle group."
      actions={<Link href="/exercises/placeholder">Open exercise detail</Link>}
    />
  );
}
