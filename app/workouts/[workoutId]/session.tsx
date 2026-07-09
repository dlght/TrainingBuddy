import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { CurrentExercisePanel } from "@/features/sessions/CurrentExercisePanel";
import { formatDuration } from "@/features/sessions/duration";
import { EffortRatingPicker } from "@/features/sessions/EffortRatingPicker";
import { type EffortRatingValue } from "@/features/sessions/effortRating";
import { getPlannedSetValues, isSessionFullyLogged, resolveNextSessionStep } from "@/features/sessions/sessionFlow";
import { SetLogEditor, type SetLogEditorValues } from "@/features/sessions/SetLogEditor";
import {
  sessionService,
  type ActiveSessionDetails
} from "@/features/sessions/sessionService";
import { setLogService } from "@/features/sessions/setLogService";
import { useElapsedSeconds } from "@/features/sessions/useElapsedSeconds";
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
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [workoutCompletedAt, setWorkoutCompletedAt] = useState<string | null>(null);
  const [previousIsWorkoutComplete, setPreviousIsWorkoutComplete] = useState(isWorkoutComplete);
  const [selectedRating, setSelectedRating] = useState<EffortRatingValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentExerciseIndex = useActiveSessionStore((state) => state.currentExerciseIndex);
  const restDurationSeconds = useActiveSessionStore((state) => state.restDurationSeconds);
  const resetForSession = useActiveSessionStore((state) => state.resetForSession);
  const setCurrentExerciseIndex = useActiveSessionStore((state) => state.setCurrentExerciseIndex);
  const resetSessionStore = useActiveSessionStore((state) => state.reset);

  const handleRestComplete = () => {
    if (!sessionDetails) {
      return;
    }

    const step = resolveNextSessionStep(
      sessionDetails.exercises.map((exercise) => ({
        id: exercise.id,
        targetSets: exercise.targetSets,
        loggedSetCount: exercise.loggedSetCount
      })),
      currentExerciseIndex
    );

    if (step.type === "next-exercise") {
      setCurrentExerciseIndex(step.index);
    } else if (step.type === "workout-complete") {
      setIsWorkoutComplete(true);
    }
  };

  const restTimer = useRestTimer(restDurationSeconds, handleRestComplete);

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
        setIsWorkoutComplete(
          isSessionFullyLogged(
            details.exercises.map((exercise) => ({
              id: exercise.id,
              targetSets: exercise.targetSets,
              loggedSetCount: exercise.loggedSetCount
            }))
          )
        );

        if (details.workout.id !== id) {
          setError("Another workout is already active. Resume or discard it before starting this one.");
        }
      })
      .catch((loadError: unknown) => {
        console.error("Workout session could not be loaded.", loadError);

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

  // React's documented "adjusting state when a prop changes" pattern: a state
  // update during render (guarded by comparing against the previous render's
  // value), not inside a useEffect, so the freeze timestamp is captured
  // exactly once, the instant isWorkoutComplete flips true.
  if (isWorkoutComplete !== previousIsWorkoutComplete) {
    setPreviousIsWorkoutComplete(isWorkoutComplete);

    if (isWorkoutComplete && workoutCompletedAt === null) {
      setWorkoutCompletedAt(new Date().toISOString());
    }
  }

  const currentExercise = useMemo(() => {
    if (!sessionDetails || sessionDetails.exercises.length === 0) {
      return null;
    }

    return sessionDetails.exercises[Math.min(currentExerciseIndex, sessionDetails.exercises.length - 1)];
  }, [currentExerciseIndex, sessionDetails]);

  const currentSetPlan = useMemo(() => {
    if (!currentExercise) {
      return null;
    }

    return getPlannedSetValues(currentExercise.setPlans, currentExercise.loggedSetCount);
  }, [currentExercise]);

  const liveElapsedSeconds = useElapsedSeconds(
    sessionDetails?.session.startedAt ?? new Date().toISOString(),
    Boolean(sessionDetails) && !isWorkoutComplete
  );

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
        weight: values.weight
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
      console.error("Set could not be saved.", saveError);
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
      await sessionService.completeSession(sessionDetails.session.id, {
        rating: selectedRating,
        endedAt: workoutCompletedAt ?? undefined
      });
      resetSessionStore();
      router.replace(`/workouts/${sessionDetails.workout.id}`);
    } catch (finishError: unknown) {
      console.error("Session could not be finished.", finishError);
      setError(finishError instanceof Error ? finishError.message : "Session could not be finished.");
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
    } catch (error) {
      console.error("Session could not be discarded.", error);
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

      {sessionDetails ? (
        <View style={styles.timerBar}>
          <Text style={styles.timerText}>{formatDuration(liveElapsedSeconds)}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <LoadingState inline message="Loading session" />
      ) : null}

      {error ? <ErrorState message={error} title="Active session" /> : null}

      {sessionDetails && isWorkoutComplete ? (
        <>
          <View style={styles.completeCard}>
            <Text style={styles.completeTitle}>Workout complete</Text>
            <Text style={styles.completeBody}>
              Every set is logged. Tap Finish workout to save it, or Discard to throw it away.
            </Text>
          </View>

          <EffortRatingPicker selectedRating={selectedRating} onSelect={setSelectedRating} />

          <FinishDiscardActions
            isFinishing={isFinishing}
            onDiscard={discardSession}
            onFinish={finishSession}
          />
        </>
      ) : null}

      {sessionDetails && !isWorkoutComplete && currentExercise ? (
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

          <SetLogEditor
            key={`${currentExercise.id}-${currentExercise.loggedSetCount}`}
            isSaving={isSavingSet}
            isBodyweight={currentExercise.isBodyweight}
            isResting={restTimer.isRunning}
            restRemainingSeconds={restTimer.remainingSeconds}
            defaultReps={currentSetPlan?.reps ?? null}
            defaultWeight={currentSetPlan?.weight ?? null}
            onSkipRest={restTimer.skip}
            onSubmit={logSet}
          />

          <FinishDiscardActions
            isFinishing={isFinishing}
            onDiscard={discardSession}
            onFinish={finishSession}
          />
        </>
      ) : null}

      {!isLoading && sessionDetails && !isWorkoutComplete && !currentExercise ? (
        <EmptyState
          title="No exercises in this session"
          message="Add exercises to the workout before starting a session."
        />
      ) : null}
    </ScrollView>
  );
}

function FinishDiscardActions({
  isFinishing,
  onFinish,
  onDiscard
}: {
  isFinishing: boolean;
  onFinish: () => void;
  onDiscard: () => void;
}) {
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        disabled={isFinishing}
        onPress={onFinish}
        style={[styles.primaryButton, isFinishing ? styles.disabled : null]}
      >
        {isFinishing ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text style={styles.primaryButtonText}>Finish workout</Text>
        )}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onDiscard} style={styles.dangerButton}>
        <Text style={styles.dangerButtonText}>Discard session</Text>
      </Pressable>
    </View>
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
  timerBar: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    alignItems: "center"
  },
  timerText: {
    color: theme.colors.text,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  completeCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    alignItems: "center"
  },
  completeTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  completeBody: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  primaryButton: {
    flex: 1,
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
    flex: 1,
    minHeight: 50,
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
