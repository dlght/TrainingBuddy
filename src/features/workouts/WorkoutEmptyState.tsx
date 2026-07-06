import { EmptyState } from "@/components/EmptyState";

export function WorkoutEmptyState() {
  return (
    <EmptyState
      title="No custom workouts yet"
      message="Use Full Body A, B, or C to start today, or copy a sample workout when you want to adjust the plan."
    />
  );
}
