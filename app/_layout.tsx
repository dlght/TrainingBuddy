import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { theme } from "@/components/theme";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: "700" }
        }}
      >
        <Stack.Screen name="index" options={{ title: "TrainingBuddy" }} />
        <Stack.Screen name="profile/setup" options={{ title: "Profile" }} />
        <Stack.Screen name="exercises/index" options={{ title: "Exercises" }} />
        <Stack.Screen name="exercises/[exerciseId]" options={{ title: "Exercise" }} />
        <Stack.Screen name="workouts/index" options={{ title: "Workouts" }} />
        <Stack.Screen name="workouts/new" options={{ title: "New Workout" }} />
        <Stack.Screen name="workouts/[workoutId]" options={{ title: "Workout" }} />
        <Stack.Screen name="workouts/[workoutId]/session" options={{ title: "Session" }} />
        <Stack.Screen name="progress/[exerciseId]" options={{ title: "Progress" }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
