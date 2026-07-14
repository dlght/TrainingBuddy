import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { exerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import {
  createSetPlanValue,
  WorkoutExerciseEditor,
  type WorkoutExerciseEditorValue
} from "@/features/workouts/WorkoutExerciseEditor";
import { workoutBuilderService } from "@/features/workouts/workoutBuilderService";
import {
  formatWorkoutValidationErrors,
  validateWorkoutDraft,
  type WorkoutValidationErrors
} from "@/features/workouts/workoutValidation";
import type { Exercise } from "@/models/exercise";
import type { WorkoutWithExercises } from "@/models/workout";
import { useExercisePickerStore } from "@/state/exercisePickerStore";

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function editorValueForExercise(exercise: Exercise, index: number): WorkoutExerciseEditorValue {
  return {
    key: `${exercise.id}-${Date.now()}-${index}`,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    imageUrl: exercise.imageUrl,
    targetRestSeconds: "60",
    setPlans: [createSetPlanValue()]
  };
}

function editorValuesForWorkout(
  workout: WorkoutWithExercises,
  exercisesById: Map<string, Exercise>
): WorkoutExerciseEditorValue[] {
  return workout.exercises.map((workoutExercise) => {
    const exercise = exercisesById.get(workoutExercise.exerciseId);
    const setPlans =
      workoutExercise.setPlans.length > 0
        ? workoutExercise.setPlans.map((plan) =>
            createSetPlanValue(String(plan.reps), plan.weight === null ? "" : String(plan.weight))
          )
        : [
            createSetPlanValue(
              String(workoutExercise.targetRepRangeLow || 10),
              workoutExercise.targetWeight === null ? "" : String(workoutExercise.targetWeight)
            )
          ];

    return {
      key: workoutExercise.id,
      exerciseId: workoutExercise.exerciseId,
      exerciseName: exercise?.name ?? workoutExercise.exerciseId,
      imageUrl: exercise?.imageUrl ?? "",
      targetRestSeconds: String(workoutExercise.targetRestSeconds),
      setPlans
    };
  });
}

export default function NewWorkoutScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const editWorkoutId = firstParam(workoutId);
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExerciseEditorValue[]>([]);
  const [validationErrors, setValidationErrors] = useState<WorkoutValidationErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const openExercisePicker = useExercisePickerStore((state) => state.open);
  const consumePickedExercise = useExercisePickerStore((state) => state.consumePicked);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      exerciseLibraryService.getLibraryData(),
      editWorkoutId ? workoutBuilderService.getWorkout(editWorkoutId) : Promise.resolve(null)
    ])
      .then(([libraryData, workout]) => {
        if (!mounted) {
          return;
        }

        const exercisesById = new Map(libraryData.exercises.map((exercise) => [exercise.id, exercise]));

        setExercises(libraryData.exercises);

        if (workout) {
          if (workout.isTemplate) {
            setError("Copy the sample workout before editing.");
            return;
          }

          setName(workout.name);
          setSelectedExercises(editorValuesForWorkout(workout, exercisesById));
        }
      })
      .catch((error) => {
        console.error("Workout builder could not be loaded.", error);

        if (mounted) {
          setError("Workout builder could not be loaded.");
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
  }, [editWorkoutId]);

  const selectedExerciseIds = useMemo(
    () => selectedExercises.map((exercise) => exercise.exerciseId),
    [selectedExercises]
  );

  const exercisesById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises]
  );

  useFocusEffect(
    useCallback(() => {
      const pickedExerciseId = consumePickedExercise();

      if (!pickedExerciseId) {
        return;
      }

      const exercise = exercisesById.get(pickedExerciseId);

      if (!exercise) {
        return;
      }

      setSelectedExercises((current) => [...current, editorValueForExercise(exercise, current.length)]);
      setValidationErrors({});
      setError(null);
    }, [consumePickedExercise, exercisesById])
  );

  const updateSelectedExercise = (index: number, value: WorkoutExerciseEditorValue) => {
    setSelectedExercises((current) =>
      current.map((exercise, currentIndex) => (currentIndex === index ? value : exercise))
    );
    setValidationErrors({});
  };

  const moveSelectedExercise = (index: number, direction: -1 | 1) => {
    setSelectedExercises((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);

      return next;
    });
  };

  const removeSelectedExercise = (index: number) => {
    setSelectedExercises((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setValidationErrors({});
  };

  const handleOpenAddExercise = () => {
    openExercisePicker(selectedExerciseIds);
    router.push("/workouts/add-exercise");
  };

  const saveWorkout = async () => {
    const values = {
      name,
      exercises: selectedExercises.map((exercise) => {
        const isBodyweight = exercisesById.get(exercise.exerciseId)?.equipment === "bodyweight";

        return {
          exerciseId: exercise.exerciseId,
          targetRestSeconds: exercise.targetRestSeconds,
          setPlans: exercise.setPlans.map((plan) => ({
            reps: plan.reps,
            weight: isBodyweight ? null : plan.weight
          }))
        };
      })
    };
    const result = validateWorkoutDraft(values);

    if (!result.isValid) {
      setValidationErrors(result.errors);
      setError(formatWorkoutValidationErrors(result.errors));
      return;
    }

    setIsSaving(true);
    setError(null);
    setValidationErrors({});

    try {
      if (editWorkoutId) {
        await workoutBuilderService.updateCustomWorkout(editWorkoutId, values);
        router.replace(`/workouts/${editWorkoutId}`);
      } else {
        await workoutBuilderService.createCustomWorkout(values);
        router.replace("/");
      }
    } catch (error) {
      console.error("Workout could not be saved.", error);
      setError("Workout could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Builder</Text>
        <Text style={styles.title}>{editWorkoutId ? "Edit workout" : "Create workout"}</Text>
      </View>

      {isLoading ? (
        <LoadingState inline message="Loading builder" />
      ) : null}

      {error ? <ErrorState message={error} title="Workout builder" /> : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          accessibilityLabel="Workout name"
          autoCapitalize="words"
          onChangeText={(value) => {
            setName(value);
            setValidationErrors({});
          }}
          placeholder="Full Body Build"
          style={[styles.input, validationErrors.name ? styles.inputError : null]}
          value={name}
        />
        {validationErrors.name ? <Text style={styles.fieldError}>{validationErrors.name}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected exercises</Text>
        {validationErrors.exercises ? <Text style={styles.fieldError}>{validationErrors.exercises}</Text> : null}
        {selectedExercises.length === 0 ? (
          <EmptyState
            title="No exercises selected"
            message="Add exercises from the library below to build your workout."
          />
        ) : null}
        {selectedExercises.map((exercise, index) => (
          <WorkoutExerciseEditor
            canMoveDown={index < selectedExercises.length - 1}
            canMoveUp={index > 0}
            errors={Object.values(validationErrors.exerciseTargets?.[index] ?? {})}
            exercise={exercise}
            index={index}
            isBodyweight={exercisesById.get(exercise.exerciseId)?.equipment === "bodyweight"}
            key={exercise.key}
            onChange={(value) => updateSelectedExercise(index, value)}
            onMoveDown={() => moveSelectedExercise(index, 1)}
            onMoveUp={() => moveSelectedExercise(index, -1)}
            onRemove={() => removeSelectedExercise(index)}
          />
        ))}
      </View>

      <View style={styles.exerciseSearchSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add exercises"
          onPress={handleOpenAddExercise}
          style={styles.addExerciseButton}
        >
          <Text style={styles.addExerciseButtonText}>+ Add exercise</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={saveWorkout}
        style={[styles.saveButton, isSaving ? styles.disabled : null]}
      >
        {isSaving ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text style={styles.saveButtonText}>{editWorkoutId ? "Update workout" : "Save workout"}</Text>
        )}
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
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
  fieldGroup: {
    gap: theme.spacing.sm
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md
  },
  inputError: {
    borderColor: "#b42318"
  },
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  saveButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  saveButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.7
  },
  fieldError: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "700"
  },
  exerciseSearchSection: {
    gap: theme.spacing.md
  },
  addExerciseButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md
  },
  addExerciseButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "800"
  }
});
