import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

import { AlternativesModal } from "@/components/AlternativesModal";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { SwipeCard } from "@/components/SwipeCard";
import { theme } from "@/components/theme";
import { exerciseLibraryService } from "@/features/exercises/exerciseLibraryService";
import {
  WorkoutExerciseEditor,
  type WorkoutExerciseEditorValue
} from "@/features/workouts/WorkoutExerciseEditor";
import { workoutBuilderService } from "@/features/workouts/workoutBuilderService";
import {
  filterExercisesByProgramType,
  getAlternativeExercises,
  getCurrentExercise
} from "@/features/workouts/swipeDeckService";
import {
  formatWorkoutValidationErrors,
  validateWorkoutDraft,
  type WorkoutValidationErrors
} from "@/features/workouts/workoutValidation";
import type { Exercise } from "@/models/exercise";
import type { WorkoutWithExercises } from "@/models/workout";
import { useSwipeDeckStore } from "@/state/swipeDeckStore";

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
    targetSets: "2",
    targetReps: "10",
    targetRestSeconds: "60",
    targetWeight: "",
    supersetGroupId: null
  };
}

function editorValuesForWorkout(
  workout: WorkoutWithExercises,
  exercisesById: Map<string, Exercise>
): WorkoutExerciseEditorValue[] {
  return workout.exercises.map((workoutExercise) => {
    const exercise = exercisesById.get(workoutExercise.exerciseId);

    return {
      key: workoutExercise.id,
      exerciseId: workoutExercise.exerciseId,
      exerciseName: exercise?.name ?? workoutExercise.exerciseId,
      targetSets: String(workoutExercise.targetSets),
      targetReps: String(workoutExercise.targetRepRangeLow || "10"),
      targetRestSeconds: String(workoutExercise.targetRestSeconds),
      targetWeight: workoutExercise.targetWeight === null ? "" : String(workoutExercise.targetWeight),
      supersetGroupId: workoutExercise.supersetGroupId
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
  const [programType, setProgramType] = useState<string | null>(null);

  const {
    availableExercises,
    addedExerciseIds,
    currentIndex,
    showAll,
    alternativesOpen,
    alternativesExercise,
    setAvailableExercises,
    addExercise,
    removeExercise,
    nextCard,
    previousCard,
    setProgramTypeFilter,
    setShowAll,
    openAlternatives,
    closeAlternatives
  } = useSwipeDeckStore();

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
        setAvailableExercises(libraryData.exercises);

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
  }, [editWorkoutId, setAvailableExercises]);

  // Reset swipe deck state when component unmounts or workout changes
  useEffect(() => {
    return () => {
      // Reset the swipe deck store when leaving the screen
      const { reset } = useSwipeDeckStore.getState();
      reset();
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

  const filteredExercises = useMemo(() => {
    return filterExercisesByProgramType(exercises, showAll ? null : programType);
  }, [exercises, programType, showAll]);

  const currentExercise = useMemo(() => {
    return getCurrentExercise(filteredExercises, currentIndex);
  }, [filteredExercises, currentIndex]);

  const alternatives = useMemo(() => {
    if (!alternativesExercise) return [];
    return getAlternativeExercises(exercises, alternativesExercise);
  }, [exercises, alternativesExercise]);

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

  const handleSwipeRight = () => {
    if (currentExercise) {
      try {
        addExercise(currentExercise);
        setSelectedExercises((current) => [...current, editorValueForExercise(currentExercise, current.length)]);
        setValidationErrors({});
        setError(null);
        nextCard();
      } catch (error) {
        console.error("Error adding exercise:", error);
        setError("Failed to add exercise");
      }
    }
  };

  const handleSwipeLeft = () => {
    try {
      nextCard();
    } catch (error) {
      console.error("Error navigating to next card:", error);
    }
  };

  const handleSwipeUp = () => {
    if (currentExercise) {
      try {
        openAlternatives(currentExercise);
      } catch (error) {
        console.error("Error opening alternatives:", error);
      }
    }
  };

  const handleSelectAlternative = (exercise: Exercise) => {
    try {
      closeAlternatives();
      addExercise(exercise);
      setSelectedExercises((current) => [...current, editorValueForExercise(exercise, current.length)]);
      setValidationErrors({});
      setError(null);
      nextCard();
    } catch (error) {
      console.error("Error selecting alternative:", error);
      setError("Failed to add alternative exercise");
    }
  };

  const handleProgramTypeChange = (type: string | null) => {
    setProgramType(type);
    setProgramTypeFilter(type);
  };

  const saveWorkout = async () => {
    const values = {
      name,
      exercises: selectedExercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        targetSets: exercise.targetSets,
        targetRepRangeLow: exercise.targetReps,
        targetRepRangeHigh: exercise.targetReps,
        targetRestSeconds: exercise.targetRestSeconds,
        targetWeight: exercisesById.get(exercise.exerciseId)?.equipment === "bodyweight" ? null : exercise.targetWeight,
        supersetGroupId: exercise.supersetGroupId
      }))
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
      const savedWorkout = editWorkoutId
        ? await workoutBuilderService.updateCustomWorkout(editWorkoutId, values)
        : await workoutBuilderService.createCustomWorkout(values);

      router.replace(`/workouts/${savedWorkout.id}`);
    } catch (error) {
      console.error("Workout could not be saved.", error);
      setError("Workout could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
        {validationErrors.supersets ? <Text style={styles.fieldError}>{validationErrors.supersets}</Text> : null}
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

      {!editWorkoutId && (
        <>
          <View style={styles.swipeDeckSection}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Program Type:</Text>
              <View style={styles.filterButtons}>
                <Pressable
                  style={[styles.filterButton, programType === "Push" ? styles.filterButtonActive : null]}
                  onPress={() => handleProgramTypeChange("Push")}
                >
                  <Text style={[styles.filterButtonText, programType === "Push" ? styles.filterButtonTextActive : null]}>Push</Text>
                </Pressable>
                <Pressable
                  style={[styles.filterButton, programType === "Pull" ? styles.filterButtonActive : null]}
                  onPress={() => handleProgramTypeChange("Pull")}
                >
                  <Text style={[styles.filterButtonText, programType === "Pull" ? styles.filterButtonTextActive : null]}>Pull</Text>
                </Pressable>
                <Pressable
                  style={[styles.filterButton, programType === "Legs" ? styles.filterButtonActive : null]}
                  onPress={() => handleProgramTypeChange("Legs")}
                >
                  <Text style={[styles.filterButtonText, programType === "Legs" ? styles.filterButtonTextActive : null]}>Legs</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.showAllRow}>
              <Text style={styles.showAllLabel}>Show all exercises</Text>
              <Switch
                value={showAll}
                onValueChange={setShowAll}
                trackColor={{ false: "#767577", true: theme.colors.primary }}
              />
            </View>
            {currentExercise ? (
              <SwipeCard
                exercise={currentExercise}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                onSwipeUp={handleSwipeUp}
                isAdded={addedExerciseIds.has(currentExercise.id)}
              />
            ) : (
              <EmptyState
                title="No more exercises"
                message="You've swiped through all available exercises."
              />
            )}
          </View>

          <AlternativesModal
            visible={alternativesOpen}
            alternatives={alternatives}
            onSelectAlternative={handleSelectAlternative}
            onClose={closeAlternatives}
          />
        </>
      )}

      {editWorkoutId && (
        <View style={styles.exerciseSearchSection}>
          <Text style={styles.sectionTitle}>Add exercises</Text>
          <TextInput
            placeholder="Search exercises..."
            style={styles.searchInput}
            placeholderTextColor={theme.colors.muted}
          />
          <ScrollView style={styles.exerciseList}>
            {exercises
              .filter((exercise) => !selectedExerciseIds.includes(exercise.id))
              .slice(0, 10)
              .map((exercise) => (
                <Pressable
                  key={exercise.id}
                  style={styles.exerciseListItem}
                  onPress={() => {
                    setSelectedExercises((current) => [...current, editorValueForExercise(exercise, current.length)]);
                    setValidationErrors({});
                    setError(null);
                  }}
                >
                  <Text style={styles.exerciseListItemName}>{exercise.name}</Text>
                  <Text style={styles.exerciseListItemMuscle}>{exercise.muscleGroupId}</Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      )}
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
  swipeDeckSection: {
    gap: theme.spacing.md
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text
  },
  filterButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: "#f3f6fb"
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text
  },
  filterButtonTextActive: {
    color: theme.colors.primaryText
  },
  showAllRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md
  },
  showAllLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text
  },
  exerciseSearchSection: {
    gap: theme.spacing.md
  },
  searchInput: {
    minHeight: 48,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  exerciseList: {
    maxHeight: 200,
    gap: theme.spacing.sm
  },
  exerciseListItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  exerciseListItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  exerciseListItemMuscle: {
    fontSize: 14,
    color: theme.colors.muted,
    textTransform: "capitalize"
  }
});
