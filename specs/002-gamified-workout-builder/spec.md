# Feature Specification: Gamified Workout Builder (Swipe-to-Build)

**Feature Branch**: `002-gamified-workout-builder`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Redesign the workout-building experience to feel more like a game and less like a form. Replace the current list-based exercise picker with a swipeable card interface, add a workout progress bar, balance meter, starter packs, drag-to-reorder, completion animation, and simplify rep targets."

## Overview

This feature enhances the existing workout builder (User Story 3 from 001-beginner-workout-tracker) by replacing the list-based ExercisePicker with a gamified swipe-to-build interface. The goal is to make workout creation feel engaging and game-like while maintaining all existing data model fields and functionality.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Swipe Card Exercise Selection (Priority: P1)

A user creates a workout by swiping through exercise cards one at a time, swiping right to add, left to skip, or up to see alternatives.

**Why this priority**: This is the core mechanic that replaces the list-based picker and must work before other gamification features can be added.

**Independent Test**: Create a new workout, swipe through at least 5 exercise cards, add 3 by swiping right, skip 2 by swiping left, and verify the added exercises appear in the workout summary.

**Acceptance Scenarios**:

1. **Given** the user is creating a workout, **When** they enter the exercise selection flow, **Then** they see a large card showing one exercise with image, name, muscle group, and color tag.
2. **Given** an exercise card is displayed, **When** the user swipes right, **Then** the exercise is added to the workout and the next card appears.
3. **Given** an exercise card is displayed, **When** the user swipes left, **Then** the exercise is skipped and the next card appears.
4. **Given** an exercise card is displayed, **When** the user swipes up, **Then** they see 2-3 alternative exercises targeting the same muscle group.
5. **Given** the user is swiping cards, **When** a Program Type filter is active, **Then** cards are filtered to show relevant exercises with a "Show All" toggle available.

---

### User Story 2 - Workout Progress Bar (Priority: P2)

As the user adds exercises, a persistent horizontal bar shows thumbnail icons of added exercises, color-coded by muscle group.

**Why this priority**: This provides immediate visual feedback on workout composition and helps users track progress.

**Independent Test**: Add 5 exercises covering different muscle groups while swiping, verify the progress bar updates live with color-coded thumbnails matching the muscle groups.

**Acceptance Scenarios**:

1. **Given** the user is swiping cards, **When** they add an exercise, **Then** a thumbnail icon appears in the progress bar with the correct muscle group color.
2. **Given** the progress bar has multiple thumbnails, **When** the user views it, **Then** thumbnails are color-coded (chest=red, back=blue, legs=green, core=yellow, shoulders=orange, arms=purple).
3. **Given** the progress bar is displayed, **When** the user taps a thumbnail, **Then** they can remove that exercise from the workout.

---

### User Story 3 - Balance Meter (Priority: P3)

A simple "workout balance" indicator increases as the user adds exercises covering more distinct muscle groups relevant to their selected Program Type.

**Why this priority**: This provides a gentle nudge toward balanced workouts without being a strict requirement.

**Independent Test**: Create a workout targeting "Push" program type, add exercises covering chest, shoulders, and triceps, verify the balance meter increases with each distinct muscle group added.

**Acceptance Scenarios**:

1. **Given** the user has selected a Program Type, **When** they add exercises, **Then** the balance meter shows the percentage of relevant muscle groups covered.
2. **Given** the balance meter is displayed, **When** the user adds an exercise from a new muscle group, **Then** the meter increases.
3. **Given** the balance meter is displayed, **When** the user finishes with an unbalanced workout, **Then** they can still save the workout.

---

### User Story 4 - Starter Packs (Priority: P4)

Before the swipe deck starts, offer 2-3 tappable "starter pack" options relevant to the chosen Program Type for one-tap addition.

**Why this priority**: This reduces friction for beginners who want a quick starting point.

**Independent Test**: Select "Push" program type, accept the "Push Day Starter" pack, verify the 3 exercises are added instantly, then continue swiping to add more.

**Acceptance Scenarios**:

1. **Given** the user has selected a Program Type, **When** they enter the workout builder, **Then** they see 2-3 starter pack options relevant to that type.
2. **Given** a starter pack is displayed, **When** the user taps it, **Then** all exercises in that pack are added to the workout.
3. **Given** the user has accepted a starter pack, **When** they continue, **Then** they can still swipe to add or remove exercises.

---

### User Story 5 - Drag-to-Reorder (Priority: P5)

On the workout summary screen, let users drag exercise cards to reorder them, replacing numeric order input fields.

**Why this priority**: This provides a more intuitive way to organize workout sequences.

**Independent Test**: Add 5 exercises, go to the summary screen, drag the third exercise to the first position, verify the new order is saved.

**Acceptance Scenarios**:

1. **Given** the user is on the workout summary screen, **When** they drag an exercise card, **Then** the card moves to the new position.
2. **Given** the user has reordered exercises, **When** they save the workout, **Then** the new order is persisted.
3. **Given** the user is reordering, **When** they drop the card, **Then** the order_index values are updated accordingly.

---

### User Story 6 - Completion Moment (Priority: P6)

When the user taps "Save Workout," show a celebratory animation plus an auto-suggested workout name based on Program Type and muscle groups covered.

**Why this priority**: This provides positive reinforcement and reduces naming friction.

**Independent Test**: Complete a workout with chest and shoulders exercises, tap save, verify confetti animation appears and the suggested name includes "Push" or relevant muscle groups.

**Acceptance Scenarios**:

1. **Given** the user has finished building a workout, **When** they tap "Save Workout," **Then** a celebratory animation plays.
2. **Given** the save dialog is displayed, **When** the user views the suggested name, **Then** it includes the Program Type and covered muscle groups (e.g., "Push Day Power Session").
3. **Given** a suggested name is displayed, **When** the user edits it, **Then** their custom name is used instead.

---

### User Story 7 - Simplified Rep Targets (Priority: P7)

Replace rep range (target_rep_range_low/high) with a single target_reps field, using quick-pick chips for common values.

**Why this priority**: This simplifies data entry and makes the builder faster to use.

**Independent Test**: Add an exercise, tap the "12" chip, verify target_reps is set to 12, use the stepper to adjust to 14, verify the value updates.

**Acceptance Scenarios**:

1. **Given** the user is setting reps for an exercise, **When** they view the rep input, **Then** they see quick-pick chips for 8, 10, 12, 15, 20.
2. **Given** the rep chips are displayed, **When** the user taps "12", **Then** target_reps is set to 12 for all sets.
3. **Given** the rep input is displayed, **When** the user uses the +/- stepper, **Then** they can adjust to any number without typing.
4. **Given** the user has set a rep target, **When** they expand "customize per set", **Then** they can set different reps per individual set (hidden by default).

### Edge Cases

- User swipes through all available exercises without adding any; the app should prompt to add at least one exercise.
- User removes all exercises from the progress bar; the app should prevent saving an empty workout.
- Program Type filter is active but no exercises match; the app should show a "No exercises found" state with "Show All" option.
- Starter pack exercises are already in the workout; the app should skip duplicates when adding the pack.
- Drag-to-reorder is interrupted by app backgrounding; the app should preserve the current order state.
- Confetti animation fails to load; the app should still show the save dialog without animation.
- User rejects all suggested names; the app should allow a completely custom name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST replace the list-based ExercisePicker with a swipeable card interface showing one exercise at a time.
- **FR-002**: Each exercise card MUST display the exercise image, name, muscle group, and a color-coded muscle group tag.
- **FR-003**: The app MUST support swipe right to add exercise, swipe left to skip, and swipe up to show alternatives.
- **FR-004**: The app MUST provide tap buttons as alternatives to swipe gestures for accessibility.
- **FR-005**: The app MUST filter exercise cards based on Program Type with a "Show All" toggle.
- **FR-006**: The app MUST show a persistent horizontal progress bar with thumbnail icons of added exercises.
- **FR-007**: Progress bar thumbnails MUST be color-coded by muscle group (chest=red, back=blue, legs=green, core=yellow, shoulders=orange, arms=purple).
- **FR-008**: The app MUST allow removing exercises by tapping their thumbnail in the progress bar.
- **FR-009**: The app MUST display a balance meter showing percentage of relevant muscle groups covered.
- **FR-010**: The balance meter MUST be based on the selected Program Type's target muscle groups.
- **FR-011**: The app MUST offer 2-3 starter pack options relevant to the selected Program Type.
- **FR-012**: Starter packs MUST add all exercises with one tap and skip duplicates.
- **FR-013**: The app MUST support drag-to-reorder on the workout summary screen.
- **FR-014**: The app MUST show a celebratory animation when the user taps "Save Workout".
- **FR-015**: The app MUST auto-suggest a workout name based on Program Type and muscle groups covered.
- **FR-016**: The app MUST allow editing the suggested name before saving.
- **FR-017**: The app MUST replace target_rep_range_low/high with a single target_reps field.
- **FR-018**: The app MUST provide quick-pick chips for common rep values (8, 10, 12, 15, 20).
- **FR-019**: The app MUST provide a +/- stepper for custom rep values without keyboard input.
- **FR-020**: The app MUST default to applying the same target_reps across all sets with optional per-set customization.
- **FR-021**: The app MUST preserve all existing data model fields (Workout, WorkoutExercise, target sets/reps/rest, superset grouping).
- **FR-022**: Superset grouping MUST still be available on the summary/reorder screen.

### Key Entities

- **SwipeCard**: UI component displaying one exercise with image, name, muscle group, and swipe actions.
- **ProgressBar**: Horizontal bar showing thumbnail icons of added exercises with muscle group colors.
- **BalanceMeter**: Visual indicator showing workout balance percentage based on Program Type.
- **StarterPack**: Pre-defined exercise sets relevant to Program Types for one-tap addition.
- **DraggableExerciseCard**: Exercise card on summary screen supporting drag-to-reorder.
- **ConfettiAnimation**: Celebratory animation shown on workout save.
- **RepInput**: Simplified rep input with quick-pick chips and +/- stepper.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add 3 exercises to a workout using swipe gestures in under 30 seconds.
- **SC-002**: A user can accept a starter pack and customize it with 2 additional exercises in under 1 minute.
- **SC-003**: A user can reorder 5 exercises using drag-to-reorder in under 20 seconds.
- **SC-004**: A user can set target reps using quick-pick chips in under 5 seconds per exercise.
- **SC-005**: The progress bar updates within 100ms of adding/removing an exercise.
- **SC-006**: The balance meter accurately reflects muscle group coverage for the selected Program Type.
- **SC-007**: The confetti animation completes within 2 seconds and does not block the save dialog.
- **SC-008**: At least 90% of users can complete a workout using the swipe interface without referring to instructions.

## Assumptions

- The existing Program Type filtering feature is already implemented and functional.
- react-native-gesture-handler is available for swipe gestures.
- expo-linear-gradient or similar is available for card styling.
- A lightweight confetti library (e.g., react-native-confetti-cannon) is available for the completion animation.
- The existing WorkoutExercise table will be migrated to replace target_rep_range_low/high with target_reps.
- Muscle group color coding follows the specified mapping (chest=red, back=blue, legs=green, core=yellow, shoulders=orange, arms=purple).
- Program Types include: Push, Pull, Legs, Upper Body, Lower Body, Full Body.
- Starter packs are defined per Program Type with 3-5 exercises each.
