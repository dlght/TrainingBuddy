# Implementation Plan: Workout Builder and Session UX Refinements

**Branch**: `003-workout-builder-and` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-workout-builder-and/spec.md`

## Summary

Nine independent refinements to the already-shipped workout builder and active session flow: optional weight for bodyweight sets, unblocking session finish, a single editable rep/set default instead of a range, bigger and fully-tappable workout navigation, a copy-to-edit flow that can't accidentally start a session, icon-based reorder controls, dropping per-exercise rest configuration, a real (non-static) home dashboard, and a splash-screen contrast fix. Two clarifications from spec.md are resolved here (see Technical Context) rather than left open, because both have a low-risk answer given the existing codebase.

## Technical Context

**Language/Version**: TypeScript, current Expo-supported React Native runtime (matches 001/002)

**Primary Dependencies**: Existing stack only — expo-router, expo-sqlite, Drizzle ORM, Zustand. No new dependencies required for this feature.

**Storage**: Single-device SQLite database. One schema change: `set_logs.weight` becomes nullable (see Complexity Tracking — this is the one non-trivial migration in this feature; everything else avoids schema changes by design, see decisions below).

**Testing**: Jest + React Native Testing Library for component/logic changes, integration tests against the real migration path (per the lessons in `dbMigrations`/seed-data incidents on this project — every migration change MUST be verified against a real SQLite engine, not just the hand-rolled test mock, before being considered done).

**Target Platform**: Expo mobile app for iOS and Android

**Project Type**: mobile-app enhancement

**Performance Goals**: No change to existing responsiveness targets; dashboard chart computation must not noticeably delay home screen render (compute from already-loaded session data, no extra network or heavy queries).

**Constraints**: Offline-only, must not regress any of the schema-drift incidents already fixed this cycle (`is_favourite`, `effort_rpe`) — any new migration follows the same self-healing, `PRAGMA`-checked pattern, never edits `initialMigrationSql` in place for a table that may already exist on a device.

**Scale/Scope**: UI/UX polish across 6 screens, one real schema migration, one dashboard data-wiring change. No new entities.

### Resolved clarifications (see spec.md open items)

- **US7 rest timer**: Keep the existing rest timer feature entirely as-is (`useRestTimer`, `RestTimerControls` already let the user view/adjust/start/skip rest live during a session — this was never gated on a per-exercise value being editable in the builder). Simply stop passing a builder-configured `targetRestSeconds` into the session; start the timer with the existing `DEFAULT_REST_SECONDS = 90` constant instead. No behavior is lost — the user still controls rest duration in the moment, they just no longer pre-configure it per exercise while building the workout. **No schema change needed**: `workout_exercises.target_rest_seconds` stays in the schema (still `NOT NULL`), the builder just stops showing an input for it and always writes a constant default (60s) on save, same as it already writes `targetSets`/other defaults today.
- **US9 splash screen**: `assets/splash.png` has no text baked into the image, and every startup-adjacent component already checked (`LoadingState`, `app/index.tsx`) uses `theme.colors.text`/`theme.colors.muted` correctly. The defect could not be located by code inspection. Task-level plan: capture a fresh cold-start screenshot during implementation and grep for any remaining hardcoded white (`#fff`/`#ffffff`/`primaryText`) applied outside a colored button background, rather than guessing at a fix blind.

### Avoiding unnecessary schema risk (US3 — single rep/set default)

The workout builder's `WorkoutExerciseEditor` **already** shows a single `targetReps` field (not a range) and already saves it as `targetRepRangeLow = targetRepRangeHigh = targetReps` — this was done as a UI-only shim in a prior session. **No new schema change is needed to satisfy US3.** This plan keeps `target_rep_range_low`/`target_rep_range_high` in the schema exactly as-is (both stay `NOT NULL`) and only touches: (a) the default value pre-filled for a *new* exercise row (currently a hardcoded `"10"` string — confirm/tune this default), and (b) the default shown for target sets. This deliberately avoids a fourth migration incident for a requirement that's already functionally met.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Beginner-first: PASS. Removing the weight requirement for bodyweight sets and the finish-session block both directly reduce friction on the primary logging path.
- Offline-first SQLite: PASS. Every change is local-only; the dashboard reads from local session data already queried today.
- Approved stack: PASS. No new dependencies, no native modules.
- Simplicity: PASS. This feature is net-simplifying (removes a field, removes a blocking validation, removes fake data) more than it adds. The one schema change (nullable weight) is scoped to a single column and justified below.
- Testable increment: PASS. Each of the 9 user stories in spec.md is independently testable and independently shippable — they do not depend on each other except where noted (US5 depends on US4's navigation entry points existing).

## Project Structure

### Documentation (this feature)

```text
specs/003-workout-builder-and/
|-- plan.md              # This file
|-- spec.md              # Feature spec with 9 prioritized user stories
`-- tasks.md              # Phase 2 output (next step)
```

### Source Code (repository root)

```text
src/
|-- db/
|   |-- migrate.ts                          # New additive migration: relax set_logs.weight to nullable
|   `-- repositories/
|       |-- sessionRepository.ts            # addSetLog: weight becomes optional param
|       `-- workoutRepository.ts            # no change (kept as-is per decision above)
|-- features/
|   |-- sessions/
|   |   |-- SetLogEditor.tsx                 # hide/mark-optional weight field for bodyweight exercises
|   |   |-- sessionValidation.ts             # weight required only when exercise is not bodyweight
|   |   `-- sessionService.ts                # completeSession: drop the "at least one set" check
|   |-- workouts/
|   |   |-- WorkoutExerciseEditor.tsx        # icon buttons for move/remove; drop rest input; tune reps/sets defaults
|   |   `-- workoutBuilderService.ts         # copyTemplateWorkout: no change needed, only the caller's navigation changes
|   `-- progress/
|       `-- progressCalculations.ts          # handle null weight in volume/weight-trend math
|-- models/
|   `-- session.ts                            # SetLog.weight: number -> number | null
`-- components/
    `-- (icon choices for move-up/move-down/remove, using @expo/vector-icons already in package.json)

app/
|-- index.tsx                                 # replace static weeklyBars/statValue/favoriteWorkouts with real data
|-- workouts/
|   |-- index.tsx                             # whole-card Pressable instead of name-only Link
|   |-- [workoutId].tsx                       # bigger Start/Edit buttons; copyTemplate navigates to /workouts/new?workoutId=
|   `-- [workoutId]/session.tsx               # rest timer starts from DEFAULT_REST_SECONDS; finish button always enabled
`-- _layout.tsx / assets/splash.png           # contrast fix once located (see Technical Context)

tests/
|-- integration/
|   |-- setLogsNullableWeight.test.ts         # new: migration + insert without weight, against real-SQLite-style checks
|   `-- finishEmptySession.test.ts            # new: completeSession with zero logged sets
`-- unit/
    |-- sessionValidation.test.ts             # updated: weight optional for bodyweight
    `-- progressCalculations.test.ts          # updated: null-weight sets excluded from weight trend, included in set history
```

**Structure Decision**: Reuse existing files wherever possible; the only new schema touchpoint is the nullable-weight migration. UI changes stay within the screens/components that already own that behavior — no new screens, no new state stores, no new services beyond what already exists.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| `set_logs.weight` schema migration (NOT NULL to nullable) | Bodyweight exercises need to log reps with no weight value, and a `0` sentinel would corrupt volume/progress math (0 weight times reps would either misrepresent real bodyweight work or require special-casing everywhere `weight` is read) | A `0` sentinel avoids a migration but pushes the "is this really zero, or bodyweight?" ambiguity into every downstream reader (progress charts, PR-exclusion logic, CSV export if ever added) instead of resolving it once at the schema level. Given this project has already shipped schema-drift incidents from taking shortcuts around `NOT NULL` columns, doing this one properly (nullable + real migration, self-healing pattern) is the safer choice this time. |

This migration MUST follow the pattern established in `src/db/migrate.ts`'s `ensureFavouriteColumn`: check the live schema via `PRAGMA table_info(set_logs)` for the column's current `notnull` flag, and only rebuild the table if it's still `1`. SQLite has no `ALTER COLUMN DROP NOT NULL`; the safe procedure is: create a new `set_logs` table with the desired schema, copy existing rows across, drop the old table, rename the new one, recreate its indexes — all inside a transaction, verified against a real SQLite engine (not just the hand-rolled `TestDatabase` mock) before shipping, exactly as was done to validate the `is_favourite`/`effort_rpe` fixes.

## Post-Design Constitution Check

- Beginner-first: PASS. No new concepts introduced; several steps removed from existing flows (weight entry, rest configuration, finish-blocking).
- Offline-first SQLite: PASS. Nullable-weight migration is local-only and self-healing like the prior two migration fixes.
- Approved stack: PASS. Confirmed no new dependencies needed anywhere in this plan.
- Simplicity: PASS. Deliberately avoided two unnecessary schema changes (reps, rest) by reusing existing UI-shim/constant-default patterns; only took on schema risk where a UI-only workaround would corrupt data semantics (weight).
- Testable increment: PASS. Each user story maps to a small, independently verifiable set of file changes; the one risky migration has an explicit real-SQLite verification requirement before it's considered done.
