# Implementation Plan: Session Duration, Streaks, and Effort Rating

**Branch**: `005-session-stats-and-media` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-session-stats-and-media/spec.md`

## Summary

Three additions to the finish/history experience: a live, big-centered elapsed-time readout on the workout-complete screen that becomes the persisted duration once finished and is then shown in history too; a computed (not stored) day-streak shown on the dashboard and on the finish screen; and an optional 1-5 effort rating captured once per session at finish, shown with a plain-language label (not a bare number) in history. One schema addition (`workout_sessions.rating`, nullable); duration and streak are both derived from data that already exists (`started_at`/`ended_at`), no new columns needed for those two.

The finish flow itself gains a small new step: tapping "Finish session" no longer navigates away immediately — it now shows a brief **session summary** state (final duration, updated streak, chosen rating) with a single "Done" button that then navigates to the workout detail screen, same as today. This is the only new screen state; everything else is additive display logic on existing screens.

## Technical Context

**Language/Version**: TypeScript, current Expo-supported React Native runtime (matches 001-004)

**Primary Dependencies**: Existing stack only — expo-router, expo-sqlite, Drizzle ORM, Zustand. No new dependencies.

**Storage**: Single-device SQLite database. One additive schema change: `workout_sessions.rating INTEGER` (nullable, new column). Duration and streak require no schema changes — both are computed from the already-existing `started_at`/`ended_at` columns.

**Testing**: Jest + React Native Testing Library. The new migration gets a real-SQLite integration test (fresh install + simulated pre-existing device), per this project's established rule. Duration formatting, streak calculation, and effort-rating label mapping are all pure functions, unit-tested without React or SQLite.

**Target Platform**: Expo mobile app for iOS and Android

**Project Type**: mobile-app enhancement

**Performance Goals**: The live elapsed-time readout ticks once per second while the workout-complete card is showing (same cost class as the existing rest-timer countdown); no other performance-sensitive addition.

**Constraints**: Offline-only. New migration follows the same self-healing, `PRAGMA`-checked pattern as `ensureWorkoutExerciseTargetWeight`/`ensureWorkoutExerciseSetPlans` — never edit `initialMigrationSql` in place for a table that may already exist on a device.

**Scale/Scope**: One new nullable column, two new pure-function modules (duration, streak) plus one small effort-rating helper module, one new screen state (post-finish summary) on the existing active-session screen, two existing screens (dashboard, history) gain a new display element each.

### Design decisions

- **Duration is computed, never stored as a separate value.** `workout_sessions.started_at`/`ended_at` already exist and are sufficient. A pure helper (`getElapsedSeconds`, `formatDuration`) turns two ISO timestamps into a display string (e.g. `"42m 13s"`, `"1h 05m"`, `"0m"` for sub-minute sessions per spec Acceptance Scenario 3). History reuses the exact same helper against `CompletedSessionSummary.startedAt`/`endedAt` — no new repository field.
- **Live duration on the complete card uses a ticking hook, not a stored "start time" re-read.** Before the user taps "Finish", `ended_at` doesn't exist yet — a small `useElapsedSeconds(startedAt, isRunning)` hook (same shape as the existing `useRestTimer` interval pattern) re-renders once per second so the centered number visibly counts up. Once "Finish session" is tapped, the persisted duration is computed from the real `startedAt`→`endedAt` delta returned by `completeSession`, not from the last tick of the live clock (spec Acceptance Scenario 2) — these can differ by up to ~1s and the persisted value is authoritative.
- **Streak is computed on demand, not stored.** A new pure function `computeStreakDays(localDatesDescendingOrUnordered, todayLocalDate)` buckets each completed session's `endedAt` into a local calendar-day string, dedupes, then walks backward from today: if today has a session, count starts at today; else if yesterday has one, count starts at yesterday (so an in-progress "hasn't worked out yet today" day doesn't look like the streak already broke); otherwise streak is 0. Walking continues one day at a time while each preceding day is present, stopping at the first gap. This reuses the existing `sessionRepository.listCompletedSessionsSince(userId, sinceIso)` method (already used for dashboard stats) with a ~60-day lookback window — no new query needed, just a new small service (`streakService`) wrapping it and calling the pure function.
- **Rating is one new nullable column, validated in application code, not a DB `CHECK`.** `workout_sessions.rating INTEGER`, added via a plain self-healing `ALTER TABLE ... ADD COLUMN` (same shape as `target_weight` in 004) rather than a `CHECK (rating BETWEEN 1 AND 5)` constraint — consistent with this project's existing precedent of validating ranges in application code (`workoutValidation.ts`-style) rather than adding SQLite-level constraints via `ALTER TABLE`, keeping the migration a plain, low-risk column add.
- **Rating capture and duration/streak display share one new screen state: "session summary".** Today, `session.tsx`'s workout-complete card shows a title/body and Finish/Discard buttons, and tapping Finish immediately navigates away. This plan extends the complete card with the live duration readout and a new `EffortRatingPicker` (5 labeled options, optional selection) so both are visible and choosable before finishing — satisfying spec User Stories 1 and 4's "on the finish screen" framing. After "Finish session" is tapped and `completeSession` resolves, the screen swaps to a **session summary** state (final duration, updated streak count, chosen rating recap or "not rated") with a single "Done" button that performs the existing `router.replace` navigation. "Discard" is not offered from the summary state (the session is already saved at that point). This is the one net-new UI state in this feature; it directly satisfies User Story 4's "on finish to mark the streak counter" wording, which describes something shown *after* finishing, not just an input control.
- **`completeSession` gains an optional rating parameter.** `sessionService.completeSession(sessionId, options?: { rating?: number | null })` → `sessionRepository.completeSession(sessionId, { rating, endedAt })`, a new repository method replacing the completion half of today's generic `updateSessionStatus` (discard keeps using `updateSessionStatus` unchanged, since discard never carries a rating).
- **Effort rating labels and any visual treatment (emoji/icon per level) live in one shared pure module** (`effortRating.ts`) so the picker (input) and history (display) can't drift out of sync on wording, consistent with the exact labels specified: 1 "In my sleep", 2 "Could do more", 3 "Right there", 4 "Almost couldn't do it", 5 "Impossible".

### Reused mechanisms (avoiding unnecessary new work)

- **`sessionRepository.listCompletedSessionsSince`** already exists (used today for dashboard stats) and is reused as-is for the streak lookback window — no new query.
- **`CompletedSessionSummary` already carries `startedAt`/`endedAt`** — history's new duration column needs no repository or query change, only a render-time call to the shared `formatDuration` helper.
- **The `useRestTimer` interval pattern** (a `setInterval` tick cleared on completion/unmount) is the template for the new `useElapsedSeconds` hook — no new interval-management approach is introduced.
- **The self-healing `ensureXxx` migration pattern** (four existing examples in `migrate.ts`) is reused verbatim for `ensureWorkoutSessionRating`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Beginner-first: Duration and streak are pure positive-reinforcement display, no new required input. Rating is explicitly optional and skippable — finishing a workout never requires it.
- Offline-first SQLite: All three features are local-only; streak and duration read from data already persisted locally, rating is one local column.
- Approved stack: No new dependencies, no native modules.
- Simplicity: Duration and streak deliberately add zero schema surface (computed from existing columns); rating is the one column genuinely required because it's new data that doesn't exist anywhere else.
- Testable increment: Each of the 4 user stories in spec.md is independently testable; duration formatting, streak calculation, and rating-label mapping are all extractable pure functions per this project's established testability pattern.

## Project Structure

### Documentation (this feature)

```text
specs/005-session-stats-and-media/
|-- plan.md              # This file
|-- spec.md              # Feature spec with 4 prioritized user stories
`-- tasks.md              # Phase 2 output (next step)
```

### Source Code (repository root)

```text
src/
|-- db/
|   |-- migrate.ts                          # NEW: ensureWorkoutSessionRating (self-healing ALTER TABLE, same pattern as prior ensureXxx fns)
|   `-- schema.ts                           # NEW: workoutSessions.rating (nullable integer)
|-- models/
|   `-- session.ts                          # NEW: WorkoutSession.rating: number | null
|-- db/repositories/
|   `-- sessionRepository.ts                # NEW: completeSession(sessionId, {rating, endedAt}); listCompletedSessions/CompletedSessionSummary gains rating
|-- features/
|   |-- sessions/
|   |   |-- sessionService.ts               # completeSession(sessionId, options?) passes rating through
|   |   |-- duration.ts                      # NEW (pure): getElapsedSeconds, formatDuration
|   |   |-- useElapsedSeconds.ts             # NEW: ticking hook for the live complete-card readout
|   |   |-- effortRating.ts                  # NEW (pure): RATING_OPTIONS + label/visual lookup, shared by picker + history
|   |   `-- EffortRatingPicker.tsx           # NEW: 5-option selector shown on the complete card
|   `-- progress/
|       |-- streak.ts                        # NEW (pure): computeStreakDays
|       |-- streakService.ts                 # NEW: wraps sessionRepository.listCompletedSessionsSince + computeStreakDays
|       `-- historyService.ts                # unchanged (history screen calls duration/effortRating helpers directly)

app/
|-- index.tsx                                 # NEW: fetch + display current streak alongside existing dashboard stats (useFocusEffect, already wired)
|-- history/index.tsx                         # NEW: render duration (formatDuration) and effort-rating badge per session card
`-- workouts/[workoutId]/session.tsx          # NEW: live duration + EffortRatingPicker on the complete card; NEW "session summary" post-finish state (duration, streak, rating recap) before navigating away

tests/
|-- integration/
|   |-- workoutSessionRating.test.ts         # NEW: migration tests against real SQLite (fresh install + drifted device), rating persists through completeSession
|   `-- sessionRepository.test.ts            # NEW or extended: completeSession persists rating + endedAt correctly, discard path unaffected
`-- unit/
    |-- duration.test.ts                     # NEW: formatDuration/getElapsedSeconds edge cases (sub-minute, hours, zero)
    |-- streak.test.ts                       # NEW: computeStreakDays (consecutive days, gap resets, same-day dedupe, today-not-yet-worked-out-but-yesterday-was)
    |-- effortRating.test.ts                 # NEW: label/visual lookup for all 5 levels + null/not-rated
    |-- ActiveSession.test.tsx               # extended: EffortRatingPicker present on complete card, session-summary state renders after Finish, duration ticks
    `-- scaffold.test.tsx                     # extended if history/dashboard smoke-test mocks need session.rating/streak fields
```

**Structure Decision**: Three small new pure-function modules (`duration.ts`, `streak.ts`, `effortRating.ts`) rather than folding this logic into the screens directly — matches this project's standing pattern (`sessionFlow.ts` from spec 004) of keeping branchy/format-sensitive logic unit-testable without React or SQLite. `useElapsedSeconds` is the one new hook, mirroring `useRestTimer`'s existing interval-cleanup shape so it doesn't introduce a second pattern for the same kind of problem.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| `workout_sessions.rating` schema addition | Effort rating is new data with no existing column to repurpose or derive from | Client-only storage (e.g. keyed local state) would break the project's offline-first, SQLite-is-source-of-truth principle and wouldn't show up in history, which is an explicit requirement (spec User Story 4) |

This migration is a plain `ALTER TABLE workout_sessions ADD COLUMN rating INTEGER;` guarded by a `PRAGMA table_info(workout_sessions)` column-exists check — no table rebuild, no `CHECK` constraint added at the DB layer (range validated in application code instead, per Design Decisions above). Verified against a real SQLite engine for both a fresh install and a simulated pre-existing device before being considered done, per this project's standing rule.

## Post-Design Constitution Check

- Beginner-first: PASS. Nothing in this feature adds a required step to logging or finishing a workout; rating is skippable, duration/streak are pure positive feedback.
- Offline-first SQLite: PASS. New column is local-only and self-healing like every prior migration in this project; duration/streak read only local data.
- Approved stack: PASS. No new dependencies.
- Simplicity: PASS. Duration and streak are computed, not stored — zero schema cost for two of the three features. The one new column is the minimum required for the one genuinely new piece of data.
- Testable increment: PASS. Duration formatting, streak calculation, and rating-label mapping are all pure, unit-tested functions; the schema change has an explicit real-SQLite verification requirement before it's considered done; each of the 4 user stories in spec.md is independently testable per its own Independent Test section.
