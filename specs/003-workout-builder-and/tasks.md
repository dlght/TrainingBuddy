---

description: "Task list for Workout Builder and Session UX Refinements implementation"
---

# Tasks: Workout Builder and Session UX Refinements

**Input**: Design documents from `/specs/003-workout-builder-and/`

**Prerequisites**: plan.md, spec.md

**Tests**: Every task touching SQLite persistence, migrations, or set-logging/session logic includes a test. UI-only polish (icons, button sizing, tap targets) uses manual Expo validation instead, per plan.md.

**Organization**: Tasks are grouped by user story so each can be implemented, tested, and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **App routes/screens**: `app/`
- **Reusable UI and feature code**: `src/components/`, `src/features/`
- **SQLite schema, migrations, data access**: `src/db/`
- **Domain models and services**: `src/models/`, `src/services/`

---

## Phase 1: Setup

**Purpose**: Confirm no new dependencies are needed (per plan.md, this feature reuses the existing stack entirely)

- [ ] T001 Confirm `@expo/vector-icons` (already a dependency) covers the icon set needed for move-up/move-down/remove in `src/features/workouts/WorkoutExerciseEditor.tsx`

---

## Phase 2: Foundational — Nullable `set_logs.weight` Migration (blocks US1 only)

**Purpose**: Relax `set_logs.weight` from `NOT NULL` to nullable so bodyweight sets can be logged with reps only

**CRITICAL**: This is the one schema-risk item in this feature. Follow the `ensureFavouriteColumn` self-healing pattern in `src/db/migrate.ts` exactly: check live schema via `PRAGMA table_info`, never edit `initialMigrationSql` in place for a table that may already exist on a device.

- [ ] T002 Write `ensureNullableSetLogsWeight(database)` in `src/db/migrate.ts`: check `PRAGMA table_info(set_logs)` for `weight`'s `notnull` flag; if still `1`, rebuild the table (create new `set_logs` with `weight REAL CHECK (weight IS NULL OR weight >= 0)`, copy rows, drop old, rename, recreate `set_logs_session_idx`/`set_logs_workout_exercise_idx`) inside a transaction
- [ ] T003 Call `ensureNullableSetLogsWeight` from `runMigrations` in `src/db/migrate.ts`, alongside the existing `ensureFavouriteColumn` call
- [ ] T004 Update `SetLog`/`NewSetLogRow` types in `src/db/schema.ts` and `src/models/session.ts`: `weight: number` → `weight: number | null`
- [ ] T005 [P] Integration test in `tests/integration/setLogsNullableWeight.test.ts`: run the migration against a real SQLite engine (`node:sqlite`, matching the pattern used to verify the `is_favourite`/`effort_rpe` fixes) simulating a device with pre-existing `NOT NULL` weight data, confirm existing rows survive, confirm a new insert with `weight: null` succeeds
- [ ] T006 Update `addSetLog` in `src/db/repositories/sessionRepository.ts` to accept and persist `weight: number | null`

**Checkpoint**: Nullable weight migration verified against real SQLite — User Story 1 implementation can now begin

---

## Phase 3: User Story 1 - Bodyweight Exercises Skip the Weight Field (Priority: P1) MVP

**Goal**: Logging a bodyweight exercise only requires reps; weight is not requested.

**Independent Test**: Start a session containing a bodyweight exercise, log a set with reps only, verify it saves and displays correctly in history — offline.

### Tests for User Story 1

- [ ] T007 [P] [US1] Update `tests/unit/sessionValidation.test.ts`: weight is required only when the exercise is not bodyweight
- [ ] T008 [P] [US1] Update `tests/unit/progressCalculations.test.ts`: sets with `weight: null` are included in set history/reps trends but excluded from weight-trend and volume-by-weight calculations without throwing or producing misleading zeros

### Implementation for User Story 1

- [ ] T009 [US1] Update `validateSetLogValues` in `src/features/sessions/sessionValidation.ts` to accept an `isBodyweight` flag and skip weight validation when true
- [ ] T010 [US1] Update `SetLogEditor` in `src/features/sessions/SetLogEditor.tsx` to accept `isBodyweight` and hide (or clearly mark optional) the weight field when true
- [ ] T011 [US1] Wire `isBodyweight` from the current exercise's `equipment`/warmup data through `app/workouts/[workoutId]/session.tsx` into `SetLogEditor` and `logSet`
- [ ] T012 [US1] Update `calculateVolumeBySession`/`calculateWeightTrendPoints` in `src/features/progress/progressCalculations.ts` to handle `weight: null` sets without corrupting volume or trend output
- [ ] T013 [US1] Validate manually in Expo: log a full bodyweight-only workout end-to-end, confirm history and progress screens show sensible values, with network disabled

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Finish a Workout at Any Time (Priority: P2)

**Goal**: A session can be finished with zero, some, or all sets logged.

**Independent Test**: Start a session, immediately finish with zero logged sets, verify it completes and shows correctly in history — offline.

### Tests for User Story 2

- [ ] T014 [P] [US2] Integration test in `tests/integration/finishEmptySession.test.ts`: `completeSession` succeeds with zero logged sets, and with a partial set of exercises logged

### Implementation for User Story 2

- [ ] T015 [US2] Remove the `setLogs.length === 0` throw in `completeSession` in `src/features/sessions/sessionService.ts`
- [ ] T016 [US2] Confirm no duplicate UI-level disable state on the finish button in `app/workouts/[workoutId]/session.tsx` re-blocks this (remove if present)
- [ ] T017 [US2] Validate manually in Expo: start and immediately finish a session with no sets logged, then repeat with a partial workout, with network disabled

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Single Default Rep Target, Customizable (Priority: P3)

**Goal**: Adding an exercise pre-fills one sensible reps value and one sensible sets value, both editable. No schema change (see plan.md decision — the low/high columns already collapse to a single value in the UI).

**Independent Test**: Add an exercise, verify defaults are pre-filled, override them, save, reopen the workout, verify the custom values (not the defaults) are shown.

### Implementation for User Story 3

- [ ] T018 [US3] Review and tune the default `targetReps`/`targetSets` values in `editorValueForExercise` in `app/workouts/new.tsx` (currently hardcoded `"10"`/`"2"`) for sensibility
- [ ] T019 [US3] Confirm `editorValuesForWorkout` in `app/workouts/new.tsx` correctly loads previously saved custom values (not defaults) when editing an existing workout — add a regression check if not already covered
- [ ] T020 [US3] Validate manually in Expo: add an exercise, accept the default, add another and customize it, save, reopen to confirm persistence

**Checkpoint**: User Story 3 functional, no migration risk introduced

---

## Phase 6: User Story 4 - One-Tap Workout Cards and Prominent Actions (Priority: P4)

**Goal**: Tapping anywhere on a workout card opens it; Start/Edit are visually prominent.

**Independent Test**: From the Workouts list, tap a card away from the name text, verify it opens. On the detail screen, verify Start/Edit read as primary buttons.

### Implementation for User Story 4

- [ ] T021 [P] [US4] In `app/workouts/index.tsx`, wrap each workout card in a `Pressable` navigating to `/workouts/${workout.id}`, keeping the favourite-toggle icon as its own nested pressable (stop propagation so it doesn't also navigate)
- [ ] T022 [P] [US4] In `app/workouts/[workoutId].tsx`, restyle the Start Session and Edit Workout actions as large primary buttons (matching `styles.primaryButton` sizing/weight already used elsewhere), replacing the current plain `Link` text elements
- [ ] T023 [US4] Validate manually in Expo: tap workout cards from several positions on the bubble, confirm navigation; confirm Start/Edit are easy to see and tap on a real device screen size

**Checkpoint**: User Story 4 functional independently

---

## Phase 7: User Story 5 - Copying a Sample Workout Opens It for Editing Only (Priority: P5)

**Goal**: "Copy to edit" lands directly in the edit screen for the new copy; the edit screen never offers Start.

**Independent Test**: From a sample workout, tap "Copy to edit," verify it opens the edit screen for the copy directly, with no Start option anywhere in that screen.

**Depends on**: User Story 4 (navigation entry points must be in place first)

### Implementation for User Story 5

- [ ] T024 [US5] In `app/workouts/[workoutId].tsx`, change `copyTemplate()` to navigate to `/workouts/new?workoutId=${copy.id}` instead of `/workouts/${copy.id}`
- [ ] T025 [US5] Confirm `app/workouts/new.tsx` (edit mode) has no Start action anywhere in its render tree (already true today — add as an explicit check, not a new restriction)
- [ ] T026 [US5] Validate manually in Expo: copy a sample workout, confirm landing directly in edit mode; save, then reopen from the Workouts list and confirm Start now appears there

**Checkpoint**: User Story 5 functional independently

---

## Phase 8: User Story 6 - Icon-Based Reorder and Remove Controls (Priority: P6)

**Goal**: Move-up, move-down, and remove use icon buttons instead of text buttons, same behavior and accessibility.

**Independent Test**: Reorder and remove exercises in the builder using the new icon buttons; verify boundary disabled-states and screen-reader labels match today's behavior.

### Implementation for User Story 6

- [ ] T027 [US6] Replace the "Up"/"Down"/"Remove" `Text`-in-`Pressable` buttons in `src/features/workouts/WorkoutExerciseEditor.tsx` with icon buttons from `@expo/vector-icons`, preserving `accessibilityLabel`s ("Move up", "Move down", "Remove") and existing disabled-at-boundary styling
- [ ] T028 [US6] Validate manually in Expo with a screen reader enabled: confirm labels announce correctly and behavior is unchanged

**Checkpoint**: User Story 6 functional independently

---

## Phase 9: User Story 7 - Remove Per-Exercise Rest Configuration (Priority: P7)

**Goal**: The builder no longer collects a rest duration per exercise; the active-session rest timer still works via its existing constant default.

**Independent Test**: Add/edit an exercise, confirm no rest field is shown; during an active session, confirm the rest timer still starts and can still be adjusted live.

### Implementation for User Story 7

- [ ] T029 [US7] Remove the "Rest" `TargetInput` field from `src/features/workouts/WorkoutExerciseEditor.tsx`
- [ ] T030 [US7] In `app/workouts/new.tsx`, always write a constant `targetRestSeconds` default (e.g. `"60"`) in `editorValueForExercise`/`saveWorkout` instead of reading a user-entered value
- [ ] T031 [US7] In `app/workouts/[workoutId]/session.tsx`, start `useRestTimer` from `DEFAULT_REST_SECONDS` (from `src/features/sessions/useRestTimer.ts`) instead of `currentExercise.targetRestSeconds`
- [ ] T032 [US7] Validate manually in Expo: build a workout, confirm no rest input appears; run a session, confirm the rest timer starts with the default and remains adjustable via `RestTimerControls`

**Checkpoint**: User Story 7 functional independently, rest timer feature unaffected

---

## Phase 10: User Story 8 - Home Dashboard Reflects Real Data (Priority: P8)

**Goal**: The home screen's weekly trend chart and stats reflect actual local session data instead of hardcoded placeholders.

**Independent Test**: Log sessions across a few days, verify the home screen chart updates; with no sessions, verify an honest empty state.

### Tests for User Story 8

- [ ] T033 [P] [US8] Unit test in `tests/unit/dashboardStats.test.ts` for a new weekly-volume-by-day calculation function, covering the empty-history case

### Implementation for User Story 8

- [ ] T034 [US8] Add a weekly volume/consistency calculation function (e.g. `getWeeklyDashboardStats`) in `src/features/progress/progressCalculations.ts` or a new `src/features/progress/dashboardStats.ts`, deriving day-by-day volume and a consistency figure from completed sessions
- [ ] T035 [US8] Replace the hardcoded `weeklyBars` array and `82%` consistency stat in `app/index.tsx` with values computed from the new function, wired through a new data-loading `useEffect` alongside the existing profile/suggestions loads
- [ ] T036 [US8] Replace or remove the hardcoded `favoriteWorkouts` array in `app/index.tsx` in favor of already-available real data (e.g. the existing `suggestedWorkouts`) or an honest empty state if no equivalent real data exists yet
- [ ] T037 [US8] Validate manually in Expo: with no logged sessions, confirm an honest zero/empty state; log sessions, confirm the chart and stat update on return to the home screen

**Checkpoint**: User Story 8 functional independently

---

## Phase 11: User Story 9 - Splash Screen Text Is Legible (Priority: P9)

**Goal**: No white-on-white (or otherwise low-contrast) text appears during app startup.

**Independent Test**: Cold-start the app, visually confirm every piece of startup text is legible.

### Implementation for User Story 9

- [ ] T038 [US9] Capture a cold-start screenshot (or ask for one) to pinpoint the exact screen/component showing low-contrast text — code inspection of `assets/splash.png` and `LoadingState.tsx` during planning did not find the defect
- [ ] T039 [US9] Fix the identified style rule once located; re-verify with a fresh cold start
- [ ] T040 [US9] Grep the codebase for hardcoded white (`#fff`, `#ffffff`, `theme.colors.primaryText`) applied outside a colored button/card background, to catch any sibling instances of the same mistake

**Checkpoint**: User Story 9 resolved once the affected screen is confirmed

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [ ] T041 [P] Run `npx tsc --noEmit` and fix any type errors surfaced by the `weight: number | null` model change rippling through consumers
- [ ] T042 [P] Run the full Jest suite (`npm test`) and update any snapshot/text assertions touched by button restyling or copy changes
- [x] T043 Run the nullable-weight migration test against a simulated drifted device (existing `NOT NULL` data, as done for the `is_favourite`/`effort_rpe` fixes) before considering T002 done
- [x] T044 End-to-end manual validation in Expo: build a bodyweight workout, log a full session finishing early, reorder and remove exercises via icons, copy a sample and confirm edit-only landing, check the home dashboard reflects it — all with network disabled
- [x] T045 Update `specs/003-workout-builder-and/spec.md` status from Draft to Delivered once all checkpoints pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS User Story 1 only
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: No dependency on Phase 2 or US1 — can run in parallel
- **User Story 3 (Phase 5)**: No dependency on any other story
- **User Story 4 (Phase 6)**: No dependency on any other story
- **User Story 5 (Phase 7)**: Depends on User Story 4 (needs the edit-mode navigation entry point in place)
- **User Story 6 (Phase 8)**: No dependency on any other story
- **User Story 7 (Phase 9)**: No dependency on any other story
- **User Story 8 (Phase 10)**: No dependency on any other story
- **User Story 9 (Phase 11)**: No dependency on any other story
- **Polish (Phase 12)**: Depends on all desired stories being complete

### Parallel Opportunities

- User Stories 2, 3, 4, 6, 7, 8, 9 can all be worked on in parallel with each other and with Phase 2/US1, since none share files with the nullable-weight migration
- User Story 5 must wait for User Story 4's navigation change to land first
- Within each story, [P]-marked test/model tasks can run in parallel; implementation tasks touching the same file are sequential

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (Setup) and Phase 2 (Foundational migration, verified against real SQLite)
2. Complete Phase 3 (User Story 1 — bodyweight logging)
3. STOP and VALIDATE in Expo, offline
4. Demo if ready

### Incremental Delivery

Ship in priority order (P1 → P9), demoing after each checkpoint. Given most stories are independent, a small team could parallelize P2/P3/P4/P6/P7/P8/P9 once Phase 2 lands, with P5 following P4.
