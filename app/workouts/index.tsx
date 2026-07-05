import { Link } from "expo-router";

import { Screen } from "@/components/Screen";

export default function WorkoutsScreen() {
  return (
    <Screen
      eyebrow="Workouts"
      title="Workouts"
      body="This placeholder will list sample workouts and custom workouts."
      actions={
        <>
          <Link href="/workouts/new">Create workout</Link>
          <Link href="/workouts/placeholder">Open workout detail</Link>
        </>
      }
    />
  );
}
