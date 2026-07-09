import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { useAuthStore } from "@/state/authStore";

export default function RootLayout() {
  const session = useAuthStore((state) => state.session);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  if (isHydrating) {
    return <LoadingState message="Loading your account" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: "700" }
        }}
      >
        {/*
          Stack.Protected excludes its screens from the navigator entirely
          when guard is false, rather than mounting them and redirecting
          away afterward — that older pattern (useEffect + router.replace)
          let signed-out-only screens mount for one frame and fire their
          data-fetching effects (each throwing "Not signed in.") before the
          redirect landed.
        */}
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="index" options={{ title: "TrainingBuddy" }} />
          <Stack.Screen name="profile/setup" options={{ title: "Profile" }} />
          <Stack.Screen name="exercises/index" options={{ title: "Exercises" }} />
          <Stack.Screen name="exercises/[exerciseId]" options={{ title: "Exercise" }} />
          <Stack.Screen name="workouts/index" options={{ title: "Workouts" }} />
          <Stack.Screen name="workouts/new" options={{ title: "New Workout" }} />
          <Stack.Screen name="workouts/add-exercise" options={{ title: "Add Exercise" }} />
          <Stack.Screen name="workouts/[workoutId]" options={{ title: "Workout" }} />
          <Stack.Screen name="workouts/[workoutId]/session" options={{ title: "Session" }} />
          <Stack.Screen name="progress/[exerciseId]" options={{ title: "Progress" }} />
          <Stack.Screen name="history/index" options={{ title: "History" }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
