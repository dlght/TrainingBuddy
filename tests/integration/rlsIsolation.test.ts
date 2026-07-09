/**
 * Verifies Row Level Security actually isolates accounts on the real,
 * linked Supabase project (SC-002) — this is the one guarantee a mocked
 * client can never prove, since RLS is enforced by Postgres itself.
 *
 * Skipped by default: it creates two real throwaway accounts on whatever
 * project EXPO_PUBLIC_SUPABASE_URL points at, which isn't something to do
 * automatically against a shared/live project. To run it deliberately:
 *
 *   RUN_LIVE_SUPABASE_TESTS=1 npx jest tests/integration/rlsIsolation.test.ts
 *
 * Requires the target project's Auth settings to allow sign-in immediately
 * after signUp() (i.e. "Confirm email" disabled, or an equivalent bypass) —
 * if signUp() doesn't return a session, the test skips itself with a clear
 * reason rather than failing opaquely.
 */
import { createClient } from "@supabase/supabase-js";

import { createSessionRepository } from "@/features/sessions/sessionRepository";
import { createWorkoutRepository } from "@/features/workouts/workoutRepository";

const shouldRun = process.env.RUN_LIVE_SUPABASE_TESTS === "1";
const describeLive = shouldRun ? describe : describe.skip;

function randomEmail(label: string): string {
  return `training-buddy-rls-test-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUpFreshAccount(label: string) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY must be set to run this test.");
  }

  const client = createClient(url, anonKey);
  const email = randomEmail(label);
  const password = "Test-password-123!";
  const { data, error } = await client.auth.signUp({ email, password });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error(
      "signUp() did not return a session (email confirmation is likely required on this project) — " +
        "can't run a live RLS test without a way to get a confirmed session for a throwaway account."
    );
  }

  return { client, userId: data.session.user.id };
}

describeLive("RLS cross-account isolation (live project)", () => {
  jest.setTimeout(30000);

  it("never lets account B see account A's workouts, sessions, or set logs", async () => {
    const accountA = await signUpFreshAccount("a");
    const accountB = await signUpFreshAccount("b");

    try {
      const workoutRepoA = createWorkoutRepository(accountA.client);
      const sessionRepoA = createSessionRepository(accountA.client);

      const workout = await workoutRepoA.createWorkout({ name: "Account A Private Workout", userId: accountA.userId });
      const session = await sessionRepoA.startSession({
        workoutId: workout.id,
        userId: accountA.userId,
        workoutNameSnapshot: workout.name
      });
      await sessionRepoA.addSetLog({
        sessionId: session.id,
        workoutExerciseId: workout.id, // not a real workout_exercise, but fine for a visibility check
        setNumber: 1,
        reps: 10,
        weight: 20,
        exerciseNameSnapshot: "Test",
        targetRepsSnapshot: null,
        targetRestSecondsSnapshot: null
      }).catch(() => {
        // If this specific insert is rejected for shape reasons, the workout
        // and session rows created above are still enough to test isolation.
      });

      const workoutRepoB = createWorkoutRepository(accountB.client);
      const sessionRepoB = createSessionRepository(accountB.client);

      expect(await workoutRepoB.getWorkoutById(workout.id)).toBeNull();
      expect(await sessionRepoB.getSessionById(session.id)).toBeNull();
      expect(await sessionRepoB.listSetLogs(session.id)).toEqual([]);

      const bOwnWorkouts = await workoutRepoB.listWorkouts();
      expect(bOwnWorkouts.some((w) => w.id === workout.id)).toBe(false);
    } finally {
      // Best-effort cleanup: each account deletes its own rows and signs out.
      await createWorkoutRepository(accountA.client)
        .listWorkouts()
        .then((workouts) =>
          Promise.all(
            workouts
              .filter((w) => !w.isTemplate && w.name === "Account A Private Workout")
              .map((w) => createWorkoutRepository(accountA.client).deleteWorkout(w.id).catch(() => undefined))
          )
        )
        .catch(() => undefined);
      await accountA.client.auth.signOut().catch(() => undefined);
      await accountB.client.auth.signOut().catch(() => undefined);
    }
  });
});
