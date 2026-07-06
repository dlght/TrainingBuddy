import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { CurrentExercisePanel } from "@/features/sessions/CurrentExercisePanel";
import { RestTimerControls } from "@/features/sessions/RestTimerControls";
import { SetLogEditor, type SetLogEditorValues } from "@/features/sessions/SetLogEditor";
import {
  sessionService,
  type ActiveSessionDetails
} from "@/features/sessions/sessionService";
import { setLogService } from "@/features/sessions/setLogService";
import { useRestTimer } from "@/features/sessions/useRestTimer";
import { useActiveSessionStore } from "@/state/activeSessionStore";

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function firstIncompleteExerciseIndex(sessionDetails: ActiveSessionDetails): number {
  const incompleteIndex = sessionDetails.exercises.findIndex(
    (exercise) => exercise.loggedSetCount < exercise.targetSets
  );

  return incompleteIndex >= 0 ? incompleteIndex : Math.max(0, sessionDetails.exercises.length - 1);
}

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const id = firstParam(workoutId);
  const [sessionDetails, setSessionDetails] = useState<ActiveSessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSet, setIsSavingSet] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentExerciseIndex = useActiveSessionStore((state) => state.currentExerciseIndex);
  const restDurationSeconds = useActiveSessionStore((state) => state.restDurationSeconds);
  const resetForSession = useActiveSessionStore((state) => state.resetForSession);
  const setCurrentExerciseIndex = useActiveSessionStore((state) => state.setCurrentExerciseIndex);
  const setRestDurationSeconds = useActiveSessionStore((state) => state.setRestDurationSeconds);
  const resetSessionStore = useActiveSessionStore((state) => state.reset);
  const restTimer = useRestTimer(restDurationSeconds);

  useEffect(() => {
    let mounted = true;

    if (!id) {
      Promise.resolve().then(() => {
        if (mounted) {
          setError("Workout session could not be loaded.");
          setIsLoading(false);
        }
      });
      return;
    }

    sessionService
      .resumeActiveSession()
      .then((activeSession) => {
        if (activeSession) {
          return activeSession;
        }

        return sessionService.startWorkoutSession(id);
      })
      .then((details) => {
        if (!mounted) {
          return;
        }

        setSessionDetails(details);
        resetForSession(details.session.id, firstIncompleteExerciseIndex(details));

        if (details.workout.id !== id) {
          setError("Another workout is already active. Resume or discard it before starting this one.");
        }
      })
      .catch((loadError: unknown) => {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Workout session could not be loaded.");
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id, resetForSession]);

  const currentExercise = useMemo(() => {
    if (!sessionDetails || sessionDetails.exercises.length === 0) {
      return null;
    }

    return sessionDetails.exercises[Math.min(currentExerciseIndex, sessionDetails.exercises.length - 1)];
  }, [currentExerciseIndex, sessionDetails]);

  const logSet = async (values: SetLogEditorValues) => {
    if (!sessionDetails || !currentExercise) {
      return;
    }

    setIsSavingSet(true);
    setError(null);

    try {
      const setLog = await setLogService.logSet({
        sessionId: sessionDetails.session.id,
        workoutExerciseId: currentExercise.id,
        reps: values.reps,
        weight: values.weight,
        effortRpe: values.effortRpe
      });

      setSessionDetails((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          setLogs: [...current.setLogs, setLog],
          exercises: current.exercises.map((exercise) =>
            exercise.id === currentExercise.id
              ? {
                  ...exercise,
                  loggedSetCount: exercise.loggedSetCount + 1
                }
              : exercise
          )
        };
      });
      restTimer.start(restDurationSeconds);
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Set could not be saved.");
    } finally {
      setIsSavingSet(false);
    }
  };

  const finishSession = async () => {
    if (!sessionDetails) {
      return;
    }

    setIsFinishing(true);
    setError(null);

    try {
      await sessionService.completeSession(sessionDetails.session.id);
      resetSessionStore();
      router.replace(`/workouts/${sessionDetails.workout.id}`);
    } catch (finishError: unknown) {
      setError(finishError instanceof Error ? finishError.message : "Session could not be finished.");
    } finally {
      setIsFinishing(false);
    }
  };

  const discardSession = async () => {
    if (!sessionDetails) {
      return;
    }

    setError(null);

    try {
      await sessionService.discardSession(sessionDetails.session.id);
      resetSessionStore();
      router.replace("/workouts");
    } catch {
      setError("Session could not be discarded.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Active session</Text>
        <Text style={styles.title}>Log workout</Text>
        {sessionDetails ? <Text style={styles.body}>{sessionDetails.session.workoutNameSnapshot}</Text> : null}
      </View>

      {isLoading ? (
        <LoadingState inline message="Loading session" />
      ) : null}

      {error ? <ErrorState message={error} title="Active session" /> : null}

      {sessionDetails && currentExercise ? (
        <>
          <CurrentExercisePanel
            exercise={currentExercise}
            exerciseCount={sessionDetails.exercises.length}
            exerciseIndex={Math.min(currentExerciseIndex, sessionDetails.exercises.length - 1)}
            setLogs={sessionDetails.setLogs}
            onNext={() =>
              setCurrentExerciseIndex(Math.min(currentExerciseIndex + 1, sessionDetails.exercises.length - 1))
            }
            onPrevious={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
          />

          <SetLogEditor isSaving={isSavingSet} onSubmit={logSet} />

          <RestTimerControls
            durationSeconds={restDurationSeconds}
            isRunning={restTimer.isRunning}
            remainingSeconds={restTimer.remainingSeconds}
            onDurationChange={(seconds) => {
              setRestDurationSeconds(seconds);
              restTimer.setDurationSeconds(seconds);
            }}
            onSkip={restTimer.skip}
            onStart={() => restTimer.start(restDurationSeconds)}
          />

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isFinishing}
              onPress={finishSession}
              style={[styles.primaryButton, isFinishing ? styles.disabled : null]}
            >
              {isFinishing ? (
                <ActivityIndicator color={theme.colors.primaryText} />
              ) : (
                <Text style={styles.primaryButtonText}>Finish session</Text>
              )}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={discardSession} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>Discard session</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {!isLoading && sessionDetails && !currentExercise ? (
        <EmptyState
          title="No exercises in this session"
          message="Add exercises to the workout before starting a session."
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  header: {
    gap: theme.spacing.xs
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800"
  },
  body: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 23
  },
  actions: {
    gap: theme.spacing.sm
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: "800"
  },
  dangerButton: {
    minHeight: 44,
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
  disabled: {
    opacity: 0.65
  }
});
