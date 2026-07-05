import { Link } from "expo-router";

import { Screen } from "@/components/Screen";

export default function HomeScreen() {
  return (
    <Screen
      eyebrow="Scaffold"
      title="TrainingBuddy"
      body="A beginner workout tracker shell is ready. The next phase adds local data and starter workouts."
      actions={
        <>
          <Link href="/profile/setup">Profile setup</Link>
          <Link href="/exercises">Exercise library</Link>
          <Link href="/workouts">Workouts</Link>
          <Link href="/progress/placeholder">Progress placeholder</Link>
        </>
      }
    />
  );
}
