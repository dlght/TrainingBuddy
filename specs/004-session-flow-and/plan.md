# Implementation Plan: Guided Session Flow, Default Set Values, and Favourite-Driven Dashboard

**Branch**: `004-session-flow-and` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-session-flow-and/spec.md`

## Summary

Five refinements to the active session and dashboard: an auto-starting, single-tap-skippable rest timer (already half-built — see decisions below), a guided flow that auto-advances between sets and exercises without manual "next" taps, per-exercise default reps/weight that make set logging a single tap, favourited workouts taking over the dashboard's suggested-workouts area, and a layout bug fix so the bodyweight reps input isn't oversized. One small schema addition (`workout_exercises.target_weight`, nullable) is required; everything else reuses existing data.

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
- Testable increment: PASS. Each of the 5 user stories in spec.md is independently testable; only US3 (defaults) and US2 (auto-advance) share a dependency (auto-advance is more satisfying with defaults, but is independently functional/testable without them).

## Project Structure

### Documentation (this feature)

```text
specs/004-session-flow-and/
|-- plan.md              # This file
|-- spec.md              # Feature spec with 5 prioritized user stories
`-- tasks.md              # Phase 2 output (next step)
```

### Source Code (repository root)

```text
src/
|-- db/
|   |-- migrate.ts                          # New additive migration: ensureWorkoutExerciseTargetWeight (ADD COLUMN)
|   |-- schema.ts                           # workoutExercises.targetWeight: real, nullable
|   `-- repositories/
|       `-- workoutRepository.ts            # insertWorkoutExercises/listWorkoutExercises/copyTemplateWorkout: carry target_weight
|-- models/
|   `-- workout.ts                          # WorkoutExercise.targetWeight: number | null
|-- features/
|   |-- workouts/
|   |   |-- workoutValidation.ts             # targetWeight: optional, non-negative when provided
|   |   `-- WorkoutExerciseEditor.tsx        # new Weight TargetInput, hidden for bodyweight exercises
|   `-- sessions/
|       |-- useRestTimer.ts                  # add onComplete callback (fires on natural expiry AND skip)
|       |-- SetLogEditor.tsx                 # accept defaultReps/defaultWeight props; fix field width so a lone (bodyweight) field doesn't stretch full-row
|       |-- sessionFlow.ts                    # NEW: pure helper - given exercises/loggedSetCount/currentIndex/justCompletedExerciseId, compute next state (same exercise, next exercise, or "workout complete")
|       `-- sessionService.ts                # ActiveSessionExercise gains defaultReps/defaultWeight (from targetRepRangeLow/targetWeight)
|   `-- progress/
|       `-- workoutRecommendationService.ts  # getSuggestedWorkouts: favourites-first ordering
|-- db/seed/
|   `-- sampleWorkouts.ts                    # target() helper gains targetWeight param; non-bodyweight sample exercises get a sensible default weight
`-- db/seed/seedVersion.ts                    # bump CURRENT_SEED_VERSION so existing devices re-sync sample workout weights

app/
|-- workouts/
|   |-- new.tsx                              # pass exercise equipment/isBodyweight into WorkoutExerciseEditor; include targetWeight in save payload
|   `-- [workoutId]/session.tsx              # wire sessionFlow.ts output to auto-advance currentExerciseIndex / show "workout complete" state; pass defaults into SetLogEditor (remount via key={currentExercise.id})

tests/
|-- integration/
|   `-- workoutExerciseTargetWeight.test.ts  # new: migration against fresh install + simulated pre-existing device
`-- unit/
    |-- sessionFlow.test.ts                  # new: same-exercise / next-exercise / workout-complete transitions, including single-exercise and single-set edge cases
    |-- workoutRecommendationService.test.ts  # updated/new: favourites-first ordering, >3 favourites, 0 favourites (unchanged behavior)
    `-- SetLogEditor.test.tsx (or equivalent) # updated: prefilled defaults, bodyweight field sizing
```

**Structure Decision**: The one new file is `sessionFlow.ts` — auto-advance sequencing is exactly the kind of branchy, easy-to-get-wrong logic (last set? last exercise? both?) that this project has repeatedly under-tested when left inline in a screen component. Pulling it out as a pure function keeps `session.tsx` a thin wiring layer and makes the four transition cases (stay, next exercise, workout complete, single-exercise workout) unit-testable without React or SQLite.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| `workout_exercises.target_weight` schema addition | Users need to set an exact default weight per exercise so sessions can be logged in one tap; there's no existing column to repurpose (unlike reps, which already collapsed to a single value in 003) | Storing a default weight in a client-only place (e.g. AsyncStorage keyed by exercise) instead of the database would break the project's offline-first, SQLite-is-the-source-of-truth principle and wouldn't survive `copyTemplateWorkout`/multi-device expectations the rest of the schema already assumes |

This migration is a plain `ALTER TABLE workout_exercises ADD COLUMN target_weight REAL;` guarded by a `PRAGMA table_info(workout_exercises)` check (column-exists test, not a `notnull` check, since there's no constraint to relax) — no table rebuild needed, unlike the 003 `set_logs.weight` migration. Still verified against a real SQLite engine for both a fresh install and a simulated pre-existing device before being considered done, per this project's standing rule.

## Post-Design Constitution Check

- Beginner-first: PASS. The primary logging loop goes from "type reps, type weight, tap log, tap next" to "tap log" for pre-configured exercises, with zero new concepts.
- Offline-first SQLite: PASS. New column is local-only and self-healing like the three prior migration fixes this project has shipped.
- Approved stack: PASS. No new dependencies.
- Simplicity: PASS. Deliberately reused the existing rep-default column and existing rest-timer/skip mechanism instead of re-building either; the only new schema surface is the one column a default weight genuinely requires.
- Testable increment: PASS. Auto-advance sequencing is isolated into a pure, unit-testable function; the schema change has an explicit real-SQLite verification requirement before it's considered done.
