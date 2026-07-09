# Implementation Plan: Guided Session Flow, Default Set Values, and Favourite-Driven Dashboard

**Branch**: `004-session-flow-and` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-session-flow-and/spec.md`

## Summary

Five refinements to the active session and dashboard: an auto-starting, single-tap-skippable rest timer (already half-built — see decisions below), a guided flow that auto-advances between sets and exercises without manual "next" taps, per-exercise default reps/weight that make set logging a single tap, favourited workouts taking over the dashboard's suggested-workouts area, and a layout bug fix so the bodyweight reps input isn't oversized. One small schema addition (`workout_exercises.target_weight`, nullable) is required; everything else reuses existing data.

**Round 2 (added after the user began manual validation)**: five more items surfaced — three are genuine bugs found while validating (broken exercise search, a dead-end "Progress" nav entry, and a dashboard that doesn't refresh on focus), one is a real feature expansion (per-set reps/weight instead of one default per exercise), and two are simplifications/layout requests (drop superset entirely, put Finish/Discard on one row). See "Round 2 decisions" below.

## Bug Fix Log (found and shipped during Round 1 validation, not originally scoped)

- **`workout_exercises` re-save FK crash**: `upsertSeedWorkout` (seed re-sync, runs on every app start) and `updateWorkout` (builder save) both used to `DELETE FROM workout_exercises WHERE workout_id = ?` then re-insert. `set_logs.workout_exercise_id` is `ON DELETE RESTRICT`, so the delete threw `FOREIGN KEY constraint failed` the instant any set had ever been logged against that workout — and since seed re-sync runs unconditionally at every `getReadyDatabaseClient()` call, this took down the *entire app* at startup (profile, dashboard, suggestions all failed together) the moment the user logged a set against a sample workout and the app restarted. Fixed by replacing both call sites with `upsertWorkoutExercises`, which upserts by the existing `UNIQUE(workout_id, order_index)` key so a row a `set_log` still points to keeps its ID; rows beyond the new count are only deleted if nothing references them. This same "never delete a row history points to" rule is why Round 2's per-set-plan storage (below) is designed as an additive table, not a delete-and-rebuild list.

## Technical Context

**Language/Version**: TypeScript, current Expo-supported React Native runtime (matches 001/002/003)

**Primary Dependencies**: Existing stack only — expo-router, expo-sqlite, Drizzle ORM, Zustand. No new dependencies.

**Storage**: Single-device SQLite database. One additive schema change: `workout_exercises.target_weight REAL` (nullable, new column — no existing `NOT NULL` relaxation needed, unlike the 003 `set_logs.weight` migration, so this is a plain self-healing `ADD COLUMN`, not a table rebuild).

**Testing**: Jest + React Native Testing Library. The new migration gets a real-SQLite integration test (fresh install + simulated pre-existing device) before being considered done, per this project's established rule that migrations are never trusted on the hand-rolled `TestDatabase` mock alone. The auto-advance sequencing (US2) is unit-testable as pure state-transition logic if extracted from the screen component (see Structure Decision).

**Target Platform**: Expo mobile app for iOS and Android

**Project Type**: mobile-app enhancement

**Performance Goals**: No change to existing responsiveness targets.

**Constraints**: Offline-only. New migration follows the same self-healing, `PRAGMA`-checked pattern as `ensureFavouriteColumn`/`ensureNullableSetLogsWeight` — never edit `initialMigrationSql` in place for a table that may already exist on a device.

**Scale/Scope**: One new nullable column, one dashboard query re-ordering, one new auto-advance state machine in the active session screen, two small UI fixes (workout builder weight field, bodyweight input sizing).

### Resolved clarifications (see spec.md open items)

- **US2 / FR-006 — does the last set auto-finish the workout?** Resolved as **no, it does not silently complete the session.** The session auto-advances through every set and exercise transition, but the very last transition (last set of the last exercise) stops at a clearly-surfaced "workout complete" state and still requires the existing explicit "Finish session" tap. Reasoning: the user's own parenthetical — "i still have to be able to complete or stop at any time with buttons" — reads as a hard requirement that ending a session is always a deliberate button press, not something that happens automatically while they're mid-motion (e.g. still resting or reaching for their phone). Silently writing `status = 'completed'` without a tap would also be the one moment in this feature where the app takes an unconfirmed, semi-irreversible action on the user's behalf, which is out of step with every other flow in the app. Concretely: once the last set's rest ends (or is skipped), the screen shows a "Workout complete — tap Finish to save" state instead of an exercise card, with Finish/Discard still present exactly as today.
- **US4 / FR-012-013 — favourite ordering when there are more than 3, or a mix of favourites and history.** Resolved as: favourited workouts fill the suggestion slots first (up to 3), in the order `workoutRepository.listFavouriteWorkouts()` already returns (`created_at DESC` — no new "favourited at" timestamp column, avoiding another schema change for an ordering detail nobody asked for). Any remaining slots are filled by the existing top-completed-workout logic, then the seeded fallback, exactly as today. This directly replaces `getSuggestedWorkouts`'s current priority order (top-completed first, favourites only as a filler) with favourites-first.

### Round 2 decisions (post-validation feedback)

- **US6 — Per-set reps/weight, new table `workout_exercise_set_plans`.** Columns: `id`, `workout_exercise_id` (FK → `workout_exercises.id`, `ON DELETE CASCADE`), `set_number` (`INTEGER NOT NULL CHECK (set_number > 0)`), `reps` (`INTEGER NOT NULL CHECK (reps > 0)`), `weight` (`REAL CHECK (weight IS NULL OR weight >= 0)`), `UNIQUE(workout_exercise_id, set_number)`. This becomes the source of truth for session prefill (replacing the single `target_rep_range_low`/`target_weight` lookup used today); `workout_exercises.target_sets`/`target_rep_range_low`/`target_rep_range_high`/`target_weight` are kept as-is and become a **derived summary** (min/max reps across plan rows, first/most-common weight) for anywhere that just wants a quick "3 sets · 8-12 reps" label, so existing consumers (`CurrentExercisePanel`, history displays) don't all need rewriting in this pass. **Backward compatibility**: a self-healing step (same `PRAGMA`-checked pattern as every other migration in this file) backfills plan rows for any `workout_exercises` row that currently has zero plan rows — one plan row per `target_sets`, each carrying `{reps: target_rep_range_low, weight: target_weight}` — so every existing workout (including all three sample workouts) gets a correct uniform plan with no data loss and no forced re-entry (FR-020). The builder's "uniform shortcut" (FR-018) is implemented as: entering sets-count + one reps/weight value writes that many identical plan rows; switching to per-set editing operates directly on the row list. Session prefill (`SetLogEditor`) now needs to know *which set number* is being logged, not just the exercise — `sessionFlow.ts`'s `resolveNextSessionStep` already tracks this implicitly via `loggedSetCount`, so the session screen passes `plan[loggedSetCount]` (0-indexed next unlogged set) into `SetLogEditor`'s `defaultReps`/`defaultWeight` instead of the exercise-wide default.
- **US7 — Remove superset UI only, no migration.** Delete `SupersetGroupControl` and its usage from `WorkoutExerciseEditor`; stop writing/reading `supersetGroupId` from the builder's save payload (always send `null` for new/edited rows going forward); remove the single-exercise-superset validation rule from `workoutValidation.ts` (dead code once the UI can't produce a superset group). The `superset_group_id` column and any pre-existing grouped data are left alone — nothing reads them anymore, and dropping the column would be schema risk this requirement doesn't call for (Assumptions, spec.md).
- **US8 — Exercise search is a pure client-side filter.** `app/workouts/new.tsx`'s "Add exercises" section already loads the full `exercises` array; the fix is adding `searchText` state, wiring the existing `TextInput`'s `value`/`onChangeText` (currently missing entirely — that's the whole bug), and filtering `exercises.filter(e => !selectedExerciseIds.includes(e.id) && e.name.toLowerCase().includes(searchText.toLowerCase()))` before the existing `.slice(0, 10)`. No new service/query — everything needed is already loaded client-side.
- **US9 — New session-list history screen, existing per-exercise view kept.** New `app/history/index.tsx` (or repurpose `app/progress/index.tsx` as the list-first screen — naming TBD at task time) backed by a new `sessionRepository`/`progressRepository` method that lists completed sessions with a summary (workout name snapshot, ended-at, set/volume count) — the dashboard's `listCompletedSessionsSince` is close but unbounded-window and dashboard-specific; a dedicated `listCompletedSessions(limit)` avoids conflating the two call sites. The bottom-nav "Progress" button in `app/index.tsx` changes from `router.push("/progress/placeholder")` (a literal stub, never wired to a real exercise) to this new route. The existing `app/progress/[exerciseId].tsx` per-exercise detail screen is unchanged and reachable from the new history list (tapping a session or exercise row).
- **US4 amendment — dashboard suggestions refresh on focus.** `app/index.tsx`'s `loadSuggestions` (and `loadDashboardStats`) currently run in a `useEffect` with `[]`/`[activeSession]` deps — mount-once, not focus-aware, so returning to the dashboard via back-navigation (the normal way to get there after favouriting on the Workouts screen) shows stale data until a full app restart. Fix: use `useFocusEffect` (re-exported by `expo-router` from `@react-navigation/native`, no new dependency) to re-run both loads every time the screen regains focus, not just on first mount.
- **US10 — Finish/Discard row layout.** `FinishDiscardActions` in `app/workouts/[workoutId]/session.tsx`: change `styles.actions` from an implicit column (`View` default) to `{ flexDirection: "row", gap: theme.spacing.sm }` and give each `Pressable` `flex: 1`.

### Reused mechanisms (avoiding unnecessary new work)

- **Rest timer auto-start already exists.** `app/workouts/[workoutId]/session.tsx`'s `logSet` already calls `restTimer.start(restDurationSeconds)` immediately after a successful save, and `RestTimerControls` already has a one-tap "Skip rest" button wired to `restTimer.skip()`. FR-001/FR-002 are functionally satisfied by existing code — this plan's only change here is adding an `onComplete` hook to `useRestTimer` (see below) so auto-advance can react to rest ending, not re-building the timer itself.
- **Default reps already has a column.** 003 already collapsed the workout builder's rep range into a single value (`targetRepRangeLow = targetRepRangeHigh`). FR-007 needs no new reps column — only wiring that existing value into the session screen as a prefill default, which does not happen today (`SetLogEditor` always starts blank).
- **Sample workouts already have non-blank rep defaults** (`target_rep_range_low`/`high` are `NOT NULL` and always seeded with real numbers). Only the new weight default needs seed-data authoring.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Beginner-first: PASS. Auto-advance and one-tap defaults remove taps from the single most-repeated action in the app; nothing adds a new concept beginners must learn.
- Offline-first SQLite: PASS. Every change is local-only; the dashboard and session screens already read from local data.
- Approved stack: PASS. No new dependencies, no native modules.
- Simplicity: PASS. One nullable column, reusing the existing rep-default column and existing rest-timer/skip mechanism rather than building new ones.
- Testable increment: PASS. Each of the 5 user stories in spec.md is independently testable; only US3 (defaults) and US2 (auto-advance) share a dependency (auto-advance is more satisfying with defaults, but is independently functional/testable without them). Round 2 adds 5 more (US6-US10), each still independently testable — see spec.md.

## Project Structure

### Documentation (this feature)

```text
specs/004-session-flow-and/
|-- plan.md              # This file
|-- spec.md              # Feature spec with 10 prioritized user stories (5 original + 5 from Round 2)
`-- tasks.md              # Phase 2 output (next step)
```

### Source Code (repository root)

```text
src/
|-- db/
|   |-- migrate.ts                          # ensureWorkoutExerciseTargetWeight (shipped); NEW: ensureWorkoutExerciseSetPlans table + backfill (Round 2, US6)
|   |-- schema.ts                           # workoutExercises.targetWeight (shipped); NEW: workoutExerciseSetPlans table (Round 2)
|   `-- repositories/
|       |-- workoutRepository.ts            # upsertWorkoutExercises (shipped, FK-safe upsert); NEW: read/write set-plan rows alongside each workout_exercise
|       `-- sessionRepository.ts            # NEW (Round 2, US9): listCompletedSessions(limit) for the history list screen
|-- models/
|   `-- workout.ts                          # WorkoutExercise.targetWeight (shipped); NEW: WorkoutExerciseSetPlan type (Round 2)
|-- features/
|   |-- workouts/
|   |   |-- workoutValidation.ts             # targetWeight (shipped); NEW: per-set plan validation, superset rule removed (Round 2)
|   |   `-- WorkoutExerciseEditor.tsx        # Weight field (shipped); NEW: per-set list editor + uniform shortcut, SupersetGroupControl removed (Round 2)
|   `-- sessions/
|       |-- useRestTimer.ts                  # onComplete callback (shipped)
|       |-- SetLogEditor.tsx                 # defaultReps/defaultWeight + field-width fix (shipped) — Round 2: caller now passes the current set's plan values, not a fixed exercise default
|       |-- sessionFlow.ts                    # resolveNextSessionStep/isSessionFullyLogged (shipped) — unchanged by Round 2, still just needs loggedSetCount/targetSets
|       `-- sessionService.ts                # defaultReps/defaultWeight (shipped) — Round 2: ActiveSessionExercise gains the full per-set plan array
|   `-- progress/
|       |-- workoutRecommendationService.ts  # favourites-first ordering (shipped)
|       `-- historyService.ts                # NEW (Round 2, US9): wraps listCompletedSessions for the history screen
|-- db/seed/
|   |-- sampleWorkouts.ts                    # target() gains targetWeight (shipped); NEW: per-set plan authoring if sample workouts want non-uniform sets (optional, uniform via backfill is sufficient)
`-- db/seed/seedVersion.ts                    # CURRENT_SEED_VERSION bump (shipped)

app/
|-- index.tsx                                 # NEW (Round 2): useFocusEffect for suggestions/dashboard refresh; bottom-nav "Progress" points at the new history route instead of /progress/placeholder
|-- history/index.tsx                         # NEW (Round 2, US9): session-list-first history screen
|-- workouts/
|   |-- new.tsx                              # targetWeight/isBodyweight wiring (shipped) — Round 2: search field wired to state+filter; per-set editor; superset UI removed
|   `-- [workoutId]/session.tsx              # auto-advance + workout-complete state (shipped) — Round 2: FinishDiscardActions row layout; SetLogEditor receives per-set plan values

tests/
|-- integration/
|   |-- workoutExerciseTargetWeight.test.ts  # migration tests (shipped)
|   |-- workoutExerciseUpsertPreservesHistory.test.ts # FK hotfix regression tests (shipped)
|   |-- workoutRecommendationService.test.ts  # favourites-first ordering (shipped)
|   `-- workoutExerciseSetPlans.test.ts      # NEW (Round 2): migration + backfill against real SQLite, fresh install + drifted device
`-- unit/
    |-- sessionFlow.test.ts                  # shipped
    |-- SetLogEditor.test.tsx                 # shipped — Round 2: extend for per-set (not just per-exercise) defaults
    |-- workoutValidation.test.ts             # shipped — Round 2: per-set plan validation, superset rule removed
    `-- historyService.test.ts               # NEW (Round 2)
```

**Structure Decision**: The one new file is `sessionFlow.ts` — auto-advance sequencing is exactly the kind of branchy, easy-to-get-wrong logic (last set? last exercise? both?) that this project has repeatedly under-tested when left inline in a screen component. Pulling it out as a pure function keeps `session.tsx` a thin wiring layer and makes the four transition cases (stay, next exercise, workout complete, single-exercise workout) unit-testable without React or SQLite.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| `workout_exercises.target_weight` schema addition | Users need to set an exact default weight per exercise so sessions can be logged in one tap; there's no existing column to repurpose (unlike reps, which already collapsed to a single value in 003) | Storing a default weight in a client-only place (e.g. AsyncStorage keyed by exercise) instead of the database would break the project's offline-first, SQLite-is-the-source-of-truth principle and wouldn't survive `copyTemplateWorkout`/multi-device expectations the rest of the schema already assumes |
| `workout_exercise_set_plans` new table (Round 2, US6) | A single reps/weight pair per exercise can't represent "set 1 at 10/15kg, set 2 at 12/12kg" — that's inherently one row per set, not one value per exercise | A JSON/serialized-array column on `workout_exercises` was considered and rejected: it can't be validated with `CHECK` constraints (no negative weight, no zero reps), can't be queried/joined the way `set_logs` already is for history, and breaks this project's established relational pattern (every other "one-to-many per exercise" concept — set_logs itself — is already a proper child table) |

This migration is a plain `ALTER TABLE workout_exercises ADD COLUMN target_weight REAL;` guarded by a `PRAGMA table_info(workout_exercises)` check (column-exists test, not a `notnull` check, since there's no constraint to relax) — no table rebuild needed, unlike the 003 `set_logs.weight` migration. Still verified against a real SQLite engine for both a fresh install and a simulated pre-existing device before being considered done, per this project's standing rule.

`workout_exercise_set_plans` is a new `CREATE TABLE IF NOT EXISTS` (safe on both fresh installs and existing devices — a brand new table has no drift risk) plus a self-healing **backfill** step: for every `workout_exercises` row with zero plan rows, insert `target_sets` rows of `{reps: target_rep_range_low, weight: target_weight}`. The backfill is what needs real-SQLite verification (idempotent — must not double-insert on a second run; must not run at all for a workout that already has explicit per-set rows from a prior save).

## Post-Design Constitution Check

- Beginner-first: PASS. The primary logging loop goes from "type reps, type weight, tap log, tap next" to "tap log" for pre-configured exercises, with zero new concepts.
- Offline-first SQLite: PASS. New column is local-only and self-healing like the three prior migration fixes this project has shipped.
- Approved stack: PASS. No new dependencies.
- Simplicity: PASS. Deliberately reused the existing rep-default column and existing rest-timer/skip mechanism instead of re-building either; the only new schema surface is the one column a default weight genuinely requires.
- Testable increment: PASS. Auto-advance sequencing is isolated into a pure, unit-testable function; the schema change has an explicit real-SQLite verification requirement before it's considered done.

### Round 2 Post-Design Constitution Check

- Beginner-first: PASS. Per-set plans keep the uniform-entry shortcut as the default path (no new required step for the common case); search and history are bug fixes restoring expected behavior, not new concepts.
- Offline-first SQLite: PASS. `workout_exercise_set_plans` is local-only, self-healing, and verified against real SQLite before being considered done, same standard as every other migration in this feature.
- Approved stack: PASS. `useFocusEffect` is already re-exported by `expo-router` (built on `@react-navigation/native`, already a transitive dependency) — no new package.
- Simplicity: PASS. Superset removal is net-simplifying (deletes a control and a validation rule, adds nothing). The new history screen is the one net-new surface in Round 2, and it's required — there is currently no working history entry point at all.
- Testable increment: PASS. Each Round 2 item (US6-US10) is independently testable per spec.md; the FK-safe upsert pattern from the Round 1 hotfix is reused directly for per-set plan writes, so no new schema-risk pattern is introduced.
