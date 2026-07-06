import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { theme } from "@/components/theme";
import { profileService } from "@/features/profile/profileService";
import {
  sessionService,
  type ActiveSessionDetails
} from "@/features/sessions/sessionService";
import type { UserProfile } from "@/models/user";

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionDetails | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isDiscardingSession, setIsDiscardingSession] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStartupState() {
      try {
        const loadedProfile = await profileService.getProfile();

        if (!mounted) {
          return;
        }

        if (!loadedProfile) {
          router.replace("/profile/setup");
          return;
        }

        setProfile(loadedProfile);

        try {
          const resumedSession = await sessionService.resumeActiveSession();

          if (mounted) {
            setActiveSession(resumedSession);
          }
        } catch {
          if (mounted) {
            setStartupError("Active session could not be checked.");
          }
        }
      } catch {
        if (mounted) {
          router.replace("/profile/setup");
        }
      } finally {
        if (mounted) {
          setIsCheckingProfile(false);
        }
      }
    }

    void loadStartupState();

    return () => {
      mounted = false;
    };
  }, [router]);

  const discardActiveSession = async () => {
    if (!activeSession) {
      return;
    }

    setIsDiscardingSession(true);
    setStartupError(null);

    try {
      await sessionService.discardSession(activeSession.session.id);
      setActiveSession(null);
    } catch {
      setStartupError("Active session could not be discarded.");
    } finally {
      setIsDiscardingSession(false);
    }
  };

  if (isCheckingProfile) {
    return <LoadingState message="Checking your local profile" title="TrainingBuddy" />;
  }

  return (
    <Screen
      eyebrow="Home"
      title={profile ? `Welcome back, ${profile.name}` : "TrainingBuddy"}
      body="Pick up with your workouts or adjust your profile."
      actions={
        <>
          {startupError ? <ErrorState message={startupError} title="Startup check" /> : null}
          {activeSession ? (
            <>
              <Text style={styles.promptTitle}>Workout in progress</Text>
              <Text style={styles.promptBody}>
                Resume {activeSession.session.workoutNameSnapshot} or discard it before starting another workout.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/workouts/${activeSession.workout.id}/session`)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Resume workout</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isDiscardingSession}
                onPress={discardActiveSession}
                style={[styles.dangerButton, isDiscardingSession ? styles.disabledButton : null]}
              >
                <Text style={styles.dangerButtonText}>
                  {isDiscardingSession ? "Discarding session" : "Discard session"}
                </Text>
              </Pressable>
            </>
          ) : null}
          <Link href="/profile/setup">Edit profile</Link>
          <Link href="/exercises">Exercise library</Link>
          <Link href="/workouts">Workouts</Link>
          <Link href="/progress/placeholder">Progress placeholder</Link>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  promptTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  promptBody: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  primaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 15,
    fontWeight: "800"
  },
  dangerButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: "#fecdca",
    backgroundColor: "#fef3f2",
    paddingHorizontal: theme.spacing.md
  },
  dangerButtonText: {
    color: "#b42318",
    fontSize: 15,
    fontWeight: "800"
  },
  disabledButton: {
    opacity: 0.65
  }
});
