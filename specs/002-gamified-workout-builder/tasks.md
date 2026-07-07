---

description: "Task list for Gamified Workout Builder implementation"
---

# Tasks: Gamified Workout Builder

**Input**: Design documents from `/specs/002-gamified-workout-builder/`

**Prerequisites**: plan.md, spec.md

**Tests**: Include React Native Testing Library tests for swipe gestures and UI components. Manual Expo validation for device flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Expo mobile app**: `app/`, `src/`, `tests/` at repository root
- **App routes/screens**: `app/`
- **Reusable UI and feature code**: `src/components/`, `src/features/`
- **SQLite schema, migrations, data access**: `src/db/`
- **Domain models and services**: `src/models/`, `src/services/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install and configure new dependencies for gamification features

- [X] T001 Install react-native-gesture-handler package in package.json
- [X] T002 Install react-native-reanimated package in package.json
- [X] T003 Install expo-linear-gradient package in package.json
- [X] T004 Install react-native-confetti-cannon or similar confetti library in package.json
- [X] T005 [P] Configure gesture handler in app/_layout.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migration for target_reps field change (blocks US7)

**CRITICAL**: US7 (Simplified Rep Targets) cannot be implemented until this migration is complete

- [ ] T006 Create Drizzle migration to replace target_rep_range_low/high with target_reps in src/db/migrations/0002_target_reps_migration.sql
- [ ] T007 Update WorkoutExercise schema in src/db/schema.ts to use target_reps instead of target_rep_range_low/high
- [ ] T008 Update migration runner in src/db/migrate.ts to include the new migration
- [ ] T009 Add integration test for migration preserving existing workout exercise data in tests/integration/targetRepsMigration.test.ts

**Checkpoint**: Database migration complete - US7 can now be implemented

---

## Phase 3: User Story 1 - Swipe Card Exercise Selection (Priority: P1) MVP

**Goal**: Replace list-based ExercisePicker with swipeable card interface showing one exercise at a time with swipe right/left/up actions.

**Independent Test**: Create a new workout, swipe through at least 5 exercise cards, add 3 by swiping right, skip 2 by swiping left, and verify the added exercises appear in the workout summary.

### Tests for User Story 1

- [ ] T010 [P] [US1] React Native test for swipe card gestures in tests/unit/SwipeCard.test.tsx
- [ ] T011 [P] [US1] React Native test for swipe deck state management in tests/unit/swipeDeckStore.test.ts

### Implementation for User Story 1

- [X] T012 [P] [US1] Create Zustand swipe deck store in src/state/swipeDeckStore.ts
- [X] T013 [P] [US1] Create SwipeCard component with gesture handling in src/components/SwipeCard.tsx
- [X] T014 [US1] Create swipe deck service for card navigation in src/features/workouts/swipeDeckService.ts
- [X] T015 [US1] Implement alternatives modal for swipe-up gesture in src/components/AlternativesModal.tsx
- [X] T016 [US1] Integrate SwipeCard into workout builder route in app/workouts/new.tsx
- [X] T017 [US1] Add tap button alternatives to swipe gestures for accessibility in src/components/SwipeCard.tsx
- [X] T018 [US1] Integrate Program Type filter with swipe deck in src/features/workouts/swipeDeckService.ts
- [X] T019 [US1] Add "Show All" toggle for Program Type filter in app/workouts/new.tsx
- [ ] T020 [US1] Validate swipe card flow manually in Expo with network disabled

**Checkpoint**: User Story 1 is fully functional - users can swipe to add exercises independently

---

## Phase 4: User Story 2 - Workout Progress Bar (Priority: P2)

**Goal**: Persistent horizontal bar showing thumbnail icons of added exercises, color-coded by muscle group.

**Independent Test**: Add 5 exercises covering different muscle groups while swiping, verify the progress bar updates live with color-coded thumbnails matching the muscle groups.

### Tests for User Story 2

- [ ] T021 [P] [US2] React Native test for progress bar updates in tests/unit/ProgressBar.test.tsx

### Implementation for User Story 2

- [ ] T022 [P] [US2] Create ProgressBar component with thumbnail icons in src/components/ProgressBar.tsx
- [ ] T023 [US2] Implement muscle group color mapping utility in src/utils/muscleGroupColors.ts
- [ ] T024 [US2] Integrate ProgressBar with swipe deck store in app/workouts/new.tsx
- [ ] T025 [US2] Add remove exercise on thumbnail tap in src/components/ProgressBar.tsx
- [ ] T026 [US2] Validate progress bar updates live in Expo

**Checkpoint**: User Stories 1 and 2 both work - swipe cards with live progress feedback

---

## Phase 5: User Story 3 - Balance Meter (Priority: P3)

**Goal**: Simple "workout balance" indicator showing percentage of relevant muscle groups covered based on Program Type.

**Independent Test**: Create a workout targeting "Push" program type, add exercises covering chest, shoulders, and triceps, verify the balance meter increases with each distinct muscle group added.

### Tests for User Story 3

- [ ] T027 [P] [US3] Unit test for balance calculation logic in tests/unit/balanceCalculator.test.ts

### Implementation for User Story 3

- [ ] T028 [P] [US3] Create balance calculator service in src/features/workouts/balanceCalculator.ts
- [ ] T029 [US3] Create BalanceMeter component in src/components/BalanceMeter.tsx
- [ ] T030 [US3] Define Program Type to muscle group mappings in src/features/workouts/balanceCalculator.ts
- [ ] T031 [US3] Integrate BalanceMeter with swipe deck store in app/workouts/new.tsx
- [ ] T032 [US3] Validate balance meter accuracy in Expo

**Checkpoint**: User Stories 1, 2, and 3 work - swipe cards with progress and balance feedback

---

## Phase 6: User Story 4 - Starter Packs (Priority: P4)

**Goal**: Offer 2-3 tappable "starter pack" options relevant to Program Type for one-tap addition before swipe deck starts.

**Independent Test**: Select "Push" program type, accept the "Push Day Starter" pack, verify the 3 exercises are added instantly, then continue swiping to add more.

### Tests for User Story 4

- [ ] T033 [P] [US4] Unit test for starter pack data loading in tests/unit/starterPackService.test.ts

### Implementation for User Story 4

- [ ] T034 [P] [US4] Create starter pack service with Program Type mappings in src/features/workouts/starterPackService.ts
- [ ] T035 [US4] Define starter pack data per Program Type in src/features/workouts/starterPackService.ts
- [ ] T036 [US4] Create StarterPack component for pack selection in src/components/StarterPack.tsx
- [ ] T037 [US4] Integrate StarterPack selection into workout builder flow in app/workouts/new.tsx
- [ ] T038 [US4] Add duplicate skipping logic when adding starter packs in src/features/workouts/starterPackService.ts
- [ ] T039 [US4] Validate starter pack flow in Expo

**Checkpoint**: User Stories 1-4 work - full swipe deck experience with starter packs

---

## Phase 7: User Story 5 - Drag-to-Reorder (Priority: P5)

**Goal**: On workout summary screen, let users drag exercise cards to reorder them, replacing numeric order input fields.

**Independent Test**: Add 5 exercises, go to the summary screen, drag the third exercise to the first position, verify the new order is saved.

### Tests for User Story 5

- [ ] T040 [P] [US5] React Native test for drag-to-reorder gestures in tests/unit/DraggableExerciseCard.test.tsx

### Implementation for User Story 5

- [ ] T041 [P] [US5] Create drag reorder service in src/features/workouts/dragReorderService.ts
- [ ] T042 [US5] Create DraggableExerciseCard component in src/components/DraggableExerciseCard.tsx
- [ ] T043 [US5] Integrate drag-to-reorder into workout summary screen in app/workouts/[workoutId].tsx
- [ ] T044 [US5] Remove numeric order input fields from workout summary in app/workouts/[workoutId].tsx
- [ ] T045 [US5] Update order_index values on drop in src/features/workouts/dragReorderService.ts
- [ ] T046 [US5] Validate drag-to-reorder in Expo

**Checkpoint**: User Stories 1-5 work - complete swipe deck with intuitive reordering

---

## Phase 8: User Story 6 - Completion Moment (Priority: P6)

**Goal**: Show celebratory animation when user taps "Save Workout" plus auto-suggested workout name based on Program Type and muscle groups.

**Independent Test**: Complete a workout with chest and shoulders exercises, tap save, verify confetti animation appears and the suggested name includes "Push" or relevant muscle groups.

### Tests for User Story 6

- [ ] T047 [P] [US6] Unit test for workout name suggestion logic in tests/unit/workoutNameSuggester.test.ts

### Implementation for User Story 6

- [ ] T048 [P] [US6] Create workout name suggester service in src/features/workouts/workoutNameSuggester.ts
- [ ] T049 [US6] Create ConfettiAnimation component in src/components/ConfettiAnimation.tsx
- [ ] T050 [US6] Integrate confetti animation into save flow in app/workouts/new.tsx
- [ ] T051 [US6] Add suggested name to save dialog in app/workouts/new.tsx
- [ ] T052 [US6] Allow editing suggested name before saving in app/workouts/new.tsx
- [ ] T053 [US6] Add fallback for animation load failure in src/components/ConfettiAnimation.tsx
- [ ] T054 [US6] Validate completion moment in Expo

**Checkpoint**: User Stories 1-6 work - complete gamified workout builder experience

---

## Phase 9: User Story 7 - Simplified Rep Targets (Priority: P7)

**Goal**: Replace rep range with single target_reps field using quick-pick chips for common values and +/- stepper for custom values.

**Independent Test**: Add an exercise, tap the "12" chip, verify target_reps is set to 12, use the stepper to adjust to 14, verify the value updates.

### Tests for User Story 7

- [ ] T055 [P] [US7] React Native test for rep input component in tests/unit/RepInput.test.tsx

### Implementation for User Story 7

- [ ] T056 [P] [US7] Create RepInput component with quick-pick chips in src/components/RepInput.tsx
- [ ] T057 [US7] Add +/- stepper for custom rep values in src/components/RepInput.tsx
- [ ] T058 [US7] Implement per-set customization expand in src/components/RepInput.tsx
- [ ] T059 [US7] Integrate RepInput into swipe card quick-add flow in src/components/SwipeCard.tsx
- [ ] T060 [US7] Integrate RepInput into starter pack flow in src/components/StarterPack.tsx
- [ ] T061 [US7] Integrate RepInput into workout summary screen in app/workouts/[workoutId].tsx
- [ ] T062 [US7] Update WorkoutExerciseEditor to use new RepInput in src/features/workouts/WorkoutExerciseEditor.tsx
- [ ] T063 [US7] Validate simplified rep entry in Expo

**Checkpoint**: All user stories complete - full gamified workout builder with simplified reps

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Integration testing, edge case handling, and final polish

- [ ] T064 [P] Add "No exercises found" state for Program Type filter in app/workouts/new.tsx
- [ ] T065 [P] Add empty workout prevention before save in app/workouts/new.tsx
- [ ] T066 [P] Add app background state preservation for drag-to-reorder in src/features/workouts/dragReorderService.ts
- [ ] T067 Update superset grouping controls to work with new UI in app/workouts/[workoutId].tsx
- [ ] T068 Run end-to-end manual validation of complete gamified flow in Expo
- [ ] T069 Validate offline behavior for all gamification features
- [ ] T070 Update README.md with gamified workout builder documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS US7 only
- **User Story 1 (Phase 3)**: Depends on Setup completion - MVP as requested by user
- **User Story 2 (Phase 4)**: Depends on US1 completion - integrates with swipe deck
- **User Story 3 (Phase 5)**: Depends on US1 completion - integrates with swipe deck
- **User Story 4 (Phase 6)**: Depends on US1 completion - integrates with swipe deck
- **User Story 5 (Phase 7)**: Depends on US1 completion - works on summary screen
- **User Story 6 (Phase 8)**: Depends on US1 completion - integrates with save flow
- **User Story 7 (Phase 9)**: Depends on Foundational (Phase 2) completion - requires schema migration
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - no dependencies on other stories (MVP)
- **User Story 2 (P2)**: Depends on US1 - integrates with swipe deck store and UI
- **User Story 3 (P3)**: Depends on US1 - integrates with swipe deck store and UI
- **User Story 4 (P4)**: Depends on US1 - integrates with swipe deck flow
- **User Story 5 (P5)**: Depends on US1 - works on workout summary screen
- **User Story 6 (P6)**: Depends on US1 - integrates with save flow
- **User Story 7 (P7)**: Depends on Foundational (Phase 2) - requires database migration

### Within Each User Story

- Tests before implementation where applicable
- Services before components
- Components before integration
- Integration before manual validation

### Parallel Opportunities

- Setup tasks T001-T005 can run in parallel
- Foundational tasks T006-T009 can run in parallel after Setup
- US2, US3, US4, US5, US6 can all start in parallel after US1 is complete
- US7 can start in parallel with US2-US6 after Foundational phase is complete
- Test tasks marked [P] can run in parallel within each story

---

## Parallel Example: User Story 1 (MVP)

```bash
# Launch tests for User Story 1 together:
Task: "React Native test for swipe card gestures in tests/unit/SwipeCard.test.tsx"
Task: "React Native test for swipe deck state management in tests/unit/swipeDeckStore.test.ts"

# Launch component work for User Story 1 together:
Task: "Create Zustand swipe deck store in src/state/swipeDeckStore.ts"
Task: "Create SwipeCard component with gesture handling in src/components/SwipeCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

As requested by the user, start with the swipe card mechanic alone:

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (Swipe Card Exercise Selection)
3. STOP and VALIDATE: Test swipe card flow independently in Expo
4. Demo if ready

### Incremental Delivery

After MVP is validated, add gamification features incrementally:

1. MVP (US1) → Test → Demo
2. Add US2 (Progress Bar) → Test → Demo
3. Add US3 (Balance Meter) → Test → Demo
4. Add US4 (Starter Packs) → Test → Demo
5. Add US5 (Drag-to-Reorder) → Test → Demo
6. Add US6 (Completion Moment) → Test → Demo
7. Add US7 (Simplified Rep Targets) → Test → Demo
8. Polish (Phase 10) → Final validation

Each feature adds value without breaking previous features.

### Parallel Team Strategy

With multiple contributors:

1. Team completes Setup + Foundational together
2. Once Setup is done:
   - Developer A: User Story 1 (MVP)
3. Once US1 is done:
   - Developer B: User Story 2 (Progress Bar)
   - Developer C: User Story 3 (Balance Meter)
   - Developer D: User Story 4 (Starter Packs)
4. Once Foundational is done:
   - Developer E: User Story 7 (Simplified Rep Targets)
5. Features complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story must be independently completable and testable
- US1 is the MVP and should be completed first before adding other gamification features
- US7 requires database migration and can be done in parallel with US2-US6 after Foundational phase
- Verify relevant tests fail before implementing
- Validate offline behavior when persistence or workout logging is touched
- Avoid vague tasks, same-file conflicts, and cross-story dependencies that break independence
