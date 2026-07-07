# Implementation Plan: Gamified Workout Builder

**Branch**: `002-gamified-workout-builder` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-gamified-workout-builder/spec.md`

## Summary

Enhance the existing workout builder (User Story 3 from 001-beginner-workout-tracker) by replacing the list-based ExercisePicker with a gamified swipe-to-build interface. Add workout progress bar, balance meter, starter packs, drag-to-reorder, completion animation, and simplified rep targets. Use react-native-gesture-handler for swipe gestures, maintain all existing data model fields, and migrate WorkoutExercise table to use single target_reps field instead of rep range.

## Technical Context

**Language/Version**: TypeScript with current Expo-supported React Native runtime

**Primary Dependencies**: Existing Expo, React Native, expo-router, expo-sqlite, Drizzle ORM, Zustand stack + react-native-gesture-handler, react-native-reanimated, expo-linear-gradient, react-native-confetti-cannon (or similar lightweight confetti library)

**Storage**: Single-device SQLite database managed through Drizzle schema and migrations (migration required for WorkoutExercise table)

**Testing**: React Native Testing Library for swipe gestures and UI components, manual Expo validation for device flows

**Target Platform**: Expo mobile app for iOS and Android

**Project Type**: mobile-app enhancement

**Performance Goals**: Swipe gestures respond within 50ms, progress bar updates within 100ms, confetti animation completes within 2 seconds

**Constraints**: Must preserve all existing data model fields, must work offline, must be accessible with tap alternatives to swipe gestures

**Scale/Scope**: Enhanced workout builder UI/UX, single database migration, new UI components for gamification

## Constitution Check

*GATE: Must pass before implementation.*

- Beginner-first: PASS. Gamified interface makes workout creation more engaging and reduces friction.
- Offline-first SQLite: PASS. All gamification features work with local data; no network required.
- Approved stack: PASS. Adding react-native-gesture-handler and reanimated are standard Expo gesture libraries.
- Simplicity: PASS WITH NOTE. Gamification adds UI complexity but maintains data model simplicity; swipe gestures are well-understood patterns.
- Testable increment: PASS. Each user story (swipe cards, progress bar, balance meter, etc.) can be tested independently.

## Project Structure

### Documentation (this feature)

```text
specs/002-gamified-workout-builder/
|-- plan.md
|-- spec.md
`-- data-model.md (optional - references existing model)
```

### Source Code (repository root)

```text
app/
|-- workouts/
|   |-- new.tsx (enhanced with swipe interface)
|   `-- [workoutId].tsx (enhanced with drag-to-reorder)

src/
|-- components/
|   |-- SwipeCard.tsx (new)
|   |-- ProgressBar.tsx (new)
|   |-- BalanceMeter.tsx (new)
|   |-- StarterPack.tsx (new)
|   |-- DraggableExerciseCard.tsx (new)
|   |-- ConfettiAnimation.tsx (new)
|   `-- RepInput.tsx (new)
|-- features/
|   |-- workouts/
|   |   |-- ExercisePicker.tsx (replaced by SwipeCard)
|   |   |-- swipeDeckService.ts (new)
|   |   |-- balanceCalculator.ts (new)
|   |   |-- starterPackService.ts (new)
|   |   |-- workoutNameSuggester.ts (new)
|   |   `-- dragReorderService.ts (new)
|-- db/
|   |-- schema.ts (migration for target_reps)
|   `-- migrations/
|       |-- 0002_target_reps_migration.sql (new)
`-- state/
    `-- swipeDeckStore.ts (new)
```

**Structure Decision**: Add new UI components under src/components/, new workout builder services under src/features/workouts/, and a new Zustand store for swipe deck state. Keep the migration minimal and focused on the target_reps field change.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Swipe gesture library | User requested swipe-to-build interface | Tap-only buttons would lose the gamified feel and engagement |
| Confetti animation | User requested celebratory completion moment | Simple toast notification would lack the positive reinforcement |
| Drag-to-reorder | User requested intuitive reordering | Numeric input fields are less intuitive and more error-prone |

## Post-Design Constitution Check

- Beginner-first: PASS. Gamified interface, starter packs, and simplified rep entry all reduce friction for beginners.
- Offline-first SQLite: PASS. All features work with local data; no network required for any gamification element.
- Approved stack: PASS. react-native-gesture-handler and reanimated are standard Expo libraries.
- Simplicity: PASS. Each gamification feature is independent and can be implemented/tested separately.
- Testable increment: PASS. Each user story has clear independent test criteria.
