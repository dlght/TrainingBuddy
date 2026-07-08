---

description: "Task list for Guided Session Flow, Default Set Values, and Favourite-Driven Dashboard implementation"

---

# Tasks: Guided Session Flow, Default Set Values, and Favourite-Driven Dashboard

**Input**: Design documents from `/specs/004-session-flow-and/`

**Prerequisites**: plan.md, spec.md

**Tests**: Every task touching SQLite persistence, migrations, or session/dashboard logic includes a test. UI-only polish (field sizing) uses manual Expo validation instead, per plan.md.

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

- [x] T001 Confirm no new packages are required — rest timer, dashboard, and builder changes all reuse existing components and `@expo/vector-icons`

---

## Phase 2: Foundational — `workout_exercises.target_weight` Migration (blocks US3 only)

**Purpose**: Add a nullable default-weight column to `workout_exercises` so exercises can carry a default weight for one-tap set logging

**CRITICAL**: Follow the `ensureFavouriteColumn`/`ensureNullableSetLogsWeight` self-healing pattern in `src/db/migrate.ts` exactly: check live schema via `PRAGMA table_info`, never edit `initialMigrationSql` in place for a table that may already exist on a device. This one is a plain `ADD COLUMN` (no existing constraint to relax), simpler than the 003 `set_logs.weight` rebuild.

- [x] T002 Write `ensureWorkoutExerciseTargetWeight(database)` in `src/db/migrate.ts`: check `PRAGMA table_info(workout_exercises)` for a `target_weight` column; if absent, run `ALTER TABLE workout_exercises ADD COLUMN target_weight REAL CHECK (target_weight IS NULL OR target_weight >= 0);` — confirmed via test that SQLite allows a CHECK constraint on ADD COLUMN
- [x] T003 Call `ensureWorkoutExerciseTargetWeight` from `runMigrations` in `src/db/migrate.ts`, alongside the existing self-healing checks
- [x] T004 Update `workoutExercises.targetWeight` in `src/db/schema.ts` (nullable `real`) and `WorkoutExercise.targetWeight: number | null` in `src/models/workout.ts`
- [x] T005 [P] Integration test in `tests/integration/workoutExerciseTargetWeight.test.ts`: run the migration against a real SQLite engine simulating a device with pre-existing `workout_exercises` rows (no `target_weight` column), confirm existing rows survive with `target_weight = null`, confirm the migration is a no-op on a second run (idempotent) — 5 tests, also covers the CHECK constraint rejecting a negative value
- [x] T006 Update `insertWorkoutExercises`/`listWorkoutExercises`/`copyTemplateWorkout` in `src/db/repositories/workoutRepository.ts` to read/write `target_weight`

**Checkpoint**: `target_weight` column verified against real SQLite — User Story 3 implementation can now begin

---

## Phase 3: User Story 1 - Rest Timer Starts Automatically, Skippable in One Tap (Priority: P1)

**Goal**: Confirm and lock in behavior that already exists in the codebase: rest starts immediately after logging a set, and a single "Skip rest" tap ends it.

**Independent Test**: Start a session, log a set, verify the rest countdown begins without further input, then verify a single tap on "Skip rest" ends the countdown immediately — offline.

**Note**: `app/workouts/[workoutId]/session.tsx`'s `logSet` already calls `restTimer.start(...)` after a successful save, and `RestTimerControls` already has a working "Skip rest" button. This story is mostly verification plus closing a test gap, not new behavior — see plan.md.

### Tests for User Story 1

- [x] T007 [P] [US1] Add a test (in `tests/unit/ActiveSession.test.tsx` or a new `tests/unit/restTimerAutoStart.test.ts`) asserting that logging a set transitions the rest timer to running without any separate "start" call, and that `skip()` ends it immediately from any elapsed point — covered by the updated `tests/unit/ActiveSession.test.tsx` plus new hook-level `onComplete` coverage in `tests/unit/useRestTimer.test.ts`

### Implementation for User Story 1

- [ ] T008 [US1] Validate manually in Expo: log a set, confirm the rest countdown starts with no extra tap; tap "Skip rest," confirm it ends immediately — with network disabled

**Post-implementation UX rework (direct user feedback, beyond original spec)**: after initial delivery, the user asked for rest to actively **block** logging the next set (not just run alongside it), and for the timer UI to live inside the "Log set" box rather than its own separate card. Implemented: `RestTimerControls.tsx` removed (deleted, no longer used anywhere); `SetLogEditor` now renders an inline "Rest mm:ss" counter + "Skip rest" button (grayed out when not resting) and disables/relabels the "Log set" button to "Resting…" while `isResting` is true. `useRestTimer` gained an `onComplete` callback (see T010) that both the natural-expiry path and `skip()` invoke, which is what re-enables logging. Covered by `tests/unit/SetLogEditor.test.tsx` and the updated `tests/unit/ActiveSession.test.tsx`.

**Checkpoint**: User Story 1 confirmed and covered by a test (behavior intentionally changed post-delivery per user feedback — see above)

---

## Phase 4: User Story 2 - Session Auto-Advances Through Sets and Exercises (Priority: P1)

**Goal**: Completing a set (and letting rest end or skipping it) moves the session forward automatically — to the next set, the next exercise's first set, or a "workout complete" state on the very last set — with Finish/Discard always available.

**Independent Test**: Start a session with 2+ exercises and 2+ sets each. Log every set using only "Complete set" and, optionally, "Skip rest." Verify the app advances automatically at each boundary, and verify Finish/Discard remain available and functional throughout.

**Depends on**: None (functions independently of default values in US3, though it's more satisfying with them)

### Tests for User Story 2

- [x] T009 [P] [US2] Unit test in `tests/unit/sessionFlow.test.ts` for a new pure function (e.g. `resolveNextSessionStep`) covering: same-exercise next set, last-set-of-exercise moves to next exercise's first set, last-set-of-last-exercise resolves to a `workout-complete` state, and a single-exercise/single-set workout resolving straight to `workout-complete`

### Implementation for User Story 2

- [x] T010 [US2] Add an `onComplete` callback param to `useRestTimer` in `src/features/sessions/useRestTimer.ts`, invoked both when the countdown naturally reaches 0 and when `skip()` is called (so skipping behaves identically to letting rest finish) — implemented via a ref so the latest closure is always used; also hardened the interval to `clearInterval` immediately on completion (found and fixed a latent double-fire risk while adding fake-timer test coverage)
- [x] T011 [US2] Add `resolveNextSessionStep` (pure function) in a new `src/features/sessions/sessionFlow.ts`: given the exercise list and current exercise index, return `{ type: "same-exercise" }`, `{ type: "next-exercise", index }`, or `{ type: "workout-complete" }` (also added `isSessionFullyLogged` for resume-safety, see T012)
- [x] T012 [US2] In `app/workouts/[workoutId]/session.tsx`: wired `useRestTimer`'s new `onComplete` (`handleRestComplete`) to call `resolveNextSessionStep` against the latest `sessionDetails`/`currentExerciseIndex` and act on the result (advance `currentExerciseIndex` via the store, or set `isWorkoutComplete`); also added an initial-load check via `isSessionFullyLogged` so resuming an already-fully-logged session lands on the complete state immediately rather than needing a rest cycle to trigger it
- [x] T013 [US2] Added a "Workout complete" state to `app/workouts/[workoutId]/session.tsx`: renders a `completeCard` message in place of the exercise card while keeping "Finish session"/"Discard session" (now a shared `FinishDiscardActions` component) visible and functional; does **not** auto-call `completeSession`
- [x] T014 [US2] Confirmed "Finish session"/"Discard session" remain reachable and functional at every point (rendered in both the exercise-flow branch and the workout-complete branch); covered end-to-end by the updated `tests/unit/ActiveSession.test.tsx`

**Checkpoint**: User Story 2 functional independently of User Story 3

---

## Phase 5: User Story 3 - Default Reps and Weight for One-Tap Set Completion (Priority: P2)

**Goal**: Workout exercises carry an editable default reps (existing column, not yet wired) and default weight (new column from Phase 2); sessions prefill from them so a set can be logged with one tap; the three sample workouts ship with non-empty defaults.

**Independent Test**: Set a default reps/weight on a custom workout's exercise, start a session, confirm the set log form is pre-filled and can be completed with a single tap without typing. Separately, start a sample workout unedited and confirm every set is already pre-filled with usable defaults.

**Depends on**: Phase 2 (target_weight column)

### Tests for User Story 3

- [x] T015 [P] [US3] Unit test in `tests/unit/workoutValidation.test.ts`: `targetWeight` is optional, accepted when a valid non-negative number, rejected when negative or non-numeric
- [x] T016 [P] [US3] New `tests/unit/SetLogEditor.test.tsx`: given `defaultReps`/`defaultWeight` props, the form renders pre-filled and submits those values unchanged on a single tap; re-applies the default reps after logging; carries forward a manually-typed weight when no default is configured; hides weight for bodyweight

### Implementation for User Story 3

- [x] T017 [US3] Add `targetWeight` to `WorkoutExerciseTargetValues`/`WorkoutExerciseTargetErrors` and `validateWorkoutExerciseTarget` in `src/features/workouts/workoutValidation.ts`: optional, must be a non-negative number when provided, stored as `null` when blank
- [x] T018 [US3] Add `targetWeight: string` to `WorkoutExerciseEditorValue` in `src/features/workouts/WorkoutExerciseEditor.tsx`; add an `isBodyweight` prop; render a Weight `TargetInput` next to Reps, hidden when `isBodyweight`
- [x] T019 [US3] In `app/workouts/new.tsx`: look up each selected exercise's `equipment` (already loaded via `exerciseLibraryService`) to pass `isBodyweight` into `WorkoutExerciseEditor`; include `targetWeight` in `editorValueForExercise`/`editorValuesForWorkout`/`saveWorkout`'s payload
- [x] T020 [US3] Add `defaultReps`/`defaultWeight` to `ActiveSessionExercise` in `src/features/sessions/sessionService.ts`, sourced from `targetRepRangeLow`/`targetWeight`
- [x] T021 [US3] Add `defaultReps`/`defaultWeight` props to `SetLogEditor` in `src/features/sessions/SetLogEditor.tsx`; initialize `values` state from them instead of always starting blank
- [x] T022 [US3] In `app/workouts/[workoutId]/session.tsx`, pass `currentExercise.defaultReps`/`defaultWeight` into `SetLogEditor` and add `key={currentExercise.id}` so the form re-initializes with the new exercise's defaults on auto-advance
- [x] T023 [US3] Add a `targetWeight` parameter to the `target()` seed helper in `src/db/seed/sampleWorkouts.ts`; set a sensible non-null default weight on every non-bodyweight exercise across the three sample workouts (bodyweight exercises stay `null`)
- [x] T024 [US3] Bump `CURRENT_SEED_VERSION` in `src/db/seed/seedVersion.ts` so existing devices re-sync the sample workouts' new default weights via `upsertSeedWorkout`
- [ ] T025 [US3] Validate manually in Expo: set defaults on a custom workout, log a full session tapping only "Log set"; separately, start each of the 3 sample workouts unedited and confirm every set has a usable pre-filled default — with network disabled

**Checkpoint**: User Story 3 functional; combined with User Story 2 this delivers the full one-tap guided flow

---

## Phase 6: User Story 4 - Favourited Workouts Replace Dashboard Suggestions (Priority: P3)

**Goal**: The dashboard's suggested-workouts area shows favourited workouts first, ahead of the existing top-completed/seeded fallback logic.

**Independent Test**: Favourite a workout that wouldn't otherwise appear in suggestions, confirm it appears on the dashboard in place of a previous default pick; un-favourite it, confirm it's removed and a default pick resumes the freed slot.

### Tests for User Story 4

- [x] T026 [P] [US4] New `tests/integration/workoutRecommendationService.test.ts` (real SQLite — the TestDatabase mock doesn't filter `WHERE is_favourite = 1` or support the top-completed JOIN/GROUP BY query): favourites take priority over top-completed workouts, 0-favourites falls back to unchanged behavior, un-favouriting removes a workout from suggestions on the next call

### Implementation for User Story 4

- [x] T027 [US4] Reorder `getSuggestedWorkouts` in `src/features/workouts/workoutRecommendationService.ts`: fill suggestion slots from `listFavouriteWorkouts()` first (up to 3), then fill any remaining slots with the existing top-completed logic, then the seeded fallback — deduping by ID as today
- [ ] T028 [US4] Validate manually in Expo: favourite a workout, return to the dashboard, confirm it now appears in the suggested area; un-favourite it, confirm it's replaced — with network disabled

**Checkpoint**: User Story 4 functional independently

---

## Phase 7: User Story 5 - Bodyweight Reps Input Matches Standard Input Sizing (Priority: P4)

**Goal**: The reps input in the set log editor is the same size whether or not the weight field is also rendered.

**Independent Test**: Open the set log editor for a bodyweight exercise and a non-bodyweight exercise, confirm the reps input renders at the same size/style in both.

### Implementation for User Story 5

- [x] T029 [US5] In `src/features/sessions/SetLogEditor.tsx`, fix `styles.field`/`styles.fields` so a lone field (bodyweight case, weight hidden) doesn't stretch to fill the full row width — cap field width consistently regardless of sibling count (e.g. fixed `flexBasis` instead of unconstrained `flex: 1`)
- [ ] T030 [US5] Validate manually in Expo: compare the reps input side-by-side between a bodyweight and non-bodyweight exercise's set log editor

**Checkpoint**: User Story 5 functional independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [x] T031 [P] Run `npx tsc --noEmit` and fix any type errors surfaced by the `targetWeight`/`defaultReps`/`defaultWeight` model changes rippling through consumers — clean
- [x] T032 [P] Run the full Jest suite (`npm test`) and update any snapshot/text assertions touched by the new fields or dashboard reordering — 36 suites / 92 tests passing
- [x] T033 Run the `target_weight` migration test against a simulated pre-existing device (no `target_weight` column) before considering T002 done
- [ ] T034 End-to-end manual validation in Expo: build a workout with default reps/weight, log a full session using only "Complete set"/"Skip rest" taps through to the workout-complete state and an explicit Finish tap; favourite a workout and confirm the dashboard reflects it; compare bodyweight vs. weighted set log editors side by side — all with network disabled
- [ ] T035 Update `specs/004-session-flow-and/spec.md` status from Draft to Delivered once all checkpoints pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS User Story 3 only
- **User Story 1 (Phase 3)**: No dependency on any other story (verification-only)
- **User Story 2 (Phase 4)**: No dependency on any other story
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2)
- **User Story 4 (Phase 6)**: No dependency on any other story
- **User Story 5 (Phase 7)**: No dependency on any other story
- **Polish (Phase 8)**: Depends on all desired stories being complete

### Parallel Opportunities

- User Stories 1, 2, 4, 5 can all be worked on in parallel with each other and with Phase 2/US3, since none share files with the `target_weight` migration
- User Story 3 must wait for Phase 2's migration to land first
- Within each story, [P]-marked test tasks can run in parallel; implementation tasks touching the same file are sequential

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (Setup) and Phase 4 (User Story 2 — auto-advance flow, the core "flow" experience, needs no schema change)
2. Complete Phase 3 (User Story 1 — confirm rest auto-start, already mostly built)
3. STOP and VALIDATE in Expo, offline: a full session can be logged with only "Complete set"/"Skip rest" taps
4. Demo if ready

### Incremental Delivery

Ship in priority order (P1 x2 → P2 → P3 → P4), demoing after each checkpoint. Phase 2's migration only blocks User Story 3; Stories 1, 2, 4, 5 can all proceed in parallel with it and with each other.
