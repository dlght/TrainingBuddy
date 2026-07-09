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

### Round 2 decisions (post-validation feedback)

- **US1 amendment — timer moves to the top of the screen, freezes on completion, Finish becomes one-tap.** The `sessionSummary` post-finish state added in the first pass is removed entirely — `finishSession` now calls `sessionService.completeSession` and immediately calls `resetSessionStore()` + `router.replace(...)`, exactly like the pre-005 behavior, restoring the single-tap Finish the user asked for ("only effort should be accounted" — nothing else should gate leaving the screen). The big duration readout moves out of the workout-complete card and into a new persistent block directly under the screen header, rendered whenever a session is loaded (not only once complete). Freezing is implemented by changing what drives `useElapsedSeconds`'s `isRunning` flag: instead of `isWorkoutComplete && !sessionSummary`, it becomes `!isWorkoutComplete` — the hook ticks the whole time the workout is in progress and simply stops ticking the render `isWorkoutComplete` flips true, which (per `useElapsedSeconds`'s existing "compute fresh only when running" design) leaves the last-rendered value in place with no further changes. The actual `endedAt` written to the database on Finish must match what was shown, so a new `workoutCompletedAt` string state is captured once via a `useEffect` watching `isWorkoutComplete` (`if (isWorkoutComplete && !workoutCompletedAt) setWorkoutCompletedAt(new Date().toISOString())`), and `finishSession` passes `endedAt: workoutCompletedAt ?? undefined` into `sessionService.completeSession` (which already accepts an `endedAt` override — the repository method added in Round 1 already supports this, it just wasn't being used by the screen). Early Finish/Discard (before the workout auto-completes) is unaffected — `workoutCompletedAt` stays `null` in that path, so the repository's own `new Date()` default is used, matching FR-002c.
- **US3 amendment — streak dropped from the finish screen, dashboard layout bug fixed.** `sessionSummary`'s removal (above) already removes the streak-on-finish display as a side effect — no separate code change needed there. The dashboard bug: `app/index.tsx`'s `heroHeader` is `flexDirection: "row"`, and the two-stat `statsRow` added in Round 1 was left nested *inside* that row (as a second column squeezed next to the three suggestion bubbles), rather than as its own full-width row — that's what pushed the streak tile off-screen. Fix: move `statsRow` out of `heroHeader` entirely, to a new sibling `View` directly under it inside `heroCard`, so both stat tiles get the card's full width.
- **US5 — tappable weekly trend chart.** `calculateWeeklyDashboardStats` (`src/features/progress/dashboardStats.ts`) already computes `volume` per day from `recentSetLogs`; it gains a parallel `setCount` per day (grouping the same `recentSetLogs` by `completedAt`'s date, counted rather than summed) — no new repository query, since `dashboardService` already fetches every set log needed. `app/index.tsx` gains `selectedDayKey` state; each day's bar becomes a `Pressable` setting it; a detail line below the chart renders `"{count} sets · {volume} volume"` for the selected day, defaulting to nothing selected until the user taps one.
- **US6 — History becomes a month calendar.** New pure module `src/features/progress/monthCalendar.ts`: `buildMonthGrid(year, monthIndex)` returns a 2D array of week-rows of date-key strings (`"YYYY-MM-DD"`) or `null` for the leading/trailing padding cells outside the month, and `shiftMonth(year, monthIndex, delta)` for prev/next navigation — both pure and unit-tested without a clock. Data layer: new `sessionRepository.listCompletedSessionsInRange(userId, startIso, endIsoExclusive)`, reusing the same `SELECT`/`GROUP BY` shape as `listCompletedSessions` but filtered by a date range instead of a `LIMIT`, ordered ascending — one query per visible month is enough to both mark the calendar (any date-key with ≥1 entry) and answer "what happened on day X" without a second query, since a single month realistically holds at most a few dozen sessions even at the ~200-total scale mentioned. `historyService` gains a thin `listCompletedSessionsInRange` wrapper. `app/history/index.tsx` is rewritten: month grid on top (marked days highlighted, prev/next month controls, current month/year label), a `selectedDateKey` state (defaulting to today if today has a session, else unselected), and the selected day's session(s) rendered below using the improved detail-card treatment from US7. The old flat unbounded list is removed — it's what motivated this rewrite in the first place.
- **US7 — History detail typography and volume removal.** Purely a `styles` change in `app/history/index.tsx`'s session-card block: `sessionMeta`'s date/duration text and the effort-rating line both move to a larger `fontSize`/`fontWeight`; the `totalVolume` conditional line is deleted from the render (the field stays in `CompletedSessionSummary`/the query — no data-layer change — it's simply not rendered, avoiding an unnecessary repository/type change for a display-only request).

### Round 3 decisions (further validation feedback — richer history detail)

- **US7 amendment — exercise count, volume+unit, resting/working time, all computed, zero schema change.** A new pure function `computeSessionBreakdown(startedAt, endedAt, setLogs: {completedAt, workoutExerciseId}[])` in `src/features/sessions/sessionBreakdown.ts`: `exerciseCount` is `new Set(setLogs.map(s => s.workoutExerciseId)).size`; `restingSeconds` is the sum of `getElapsedSeconds(prev.completedAt, curr.completedAt)` across consecutive set logs sorted by `completedAt`; `workingSeconds` is `max(0, totalSeconds - restingSeconds)` where `totalSeconds = getElapsedSeconds(startedAt, endedAt)`. This reuses the existing `duration.ts` helpers and needs no new column — `set_logs.completed_at` and `workout_sessions.started_at/ended_at` already carry everything required, and (unlike a live-capture approach) it works retroactively for every session ever logged, not only ones completed after this ships.
- **Per-session detail fetched on demand, not for the whole month.** `historyService` gains `listSetLogsForSession(sessionId)`, a thin wrapper around the already-existing `sessionRepository.listSetLogs(sessionId)` (used today by the active-session flow). The month-level `listCompletedSessionsInRange` query is untouched — it stays cheap for the calendar/marking use case. `app/history/index.tsx` fetches set logs (and computes the breakdown) only for the currently `selectedSessions`, in a `useEffect` keyed on `selectedDateKey`, caching results in a `Map<sessionId, SessionBreakdown>` so re-selecting a previously-viewed day doesn't refetch.
- **Volume's unit comes from the user's actual profile setting, not a hardcoded "kg".** The app already supports `kg`/`lb` (`UserProfile.weightUnit`) with no conversion logic anywhere — weights are stored as entered. The history screen fetches the profile once (`profileService.getProfile()`, same call already used elsewhere) and renders `${totalVolume} ${weightUnit}`, defaulting to `"kg"` only while the profile hasn't loaded yet or in the (should-never-happen-post-onboarding) case it's null.

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
|-- index.tsx                                 # fetch + display current streak (shipped); Round 2: statsRow moved out of heroHeader (layout fix); selectedDayKey + tappable trend chart bars
|-- history/index.tsx                         # shipped: duration + rating per card; Round 2: rewritten around a month calendar (buildMonthGrid/shiftMonth), selected-day detail, larger date/duration/effort type, volume removed; Round 3: fetches profile weightUnit + per-session breakdown (exerciseCount/volume+unit/resting/working) for selectedSessions on demand
`-- workouts/[workoutId]/session.tsx          # shipped: EffortRatingPicker on the complete card; Round 2: sessionSummary state removed, timer moves to a persistent block under the header, workoutCompletedAt freeze state, one-tap Finish

src/features/progress/
|-- dashboardStats.ts                         # Round 2: calculateWeeklyDashboardStats gains per-day setCount alongside volume
`-- monthCalendar.ts                          # NEW (Round 2): buildMonthGrid, shiftMonth — pure, unit-tested

src/features/sessions/sessionBreakdown.ts      # NEW (Round 3): computeSessionBreakdown (exerciseCount, workingSeconds, restingSeconds) — pure, unit-tested

src/db/repositories/sessionRepository.ts       # Round 2: NEW listCompletedSessionsInRange(userId, startIso, endIsoExclusive)
src/features/progress/historyService.ts        # Round 2: NEW listCompletedSessionsInRange wrapper; Round 3: NEW listSetLogsForSession wrapper

tests/
|-- integration/
|   |-- workoutSessionRating.test.ts         # migration tests against real SQLite (fresh install + drifted device), rating persists through completeSession
|   `-- historyService.test.ts               # Round 2: extended for listCompletedSessionsInRange
`-- unit/
    |-- duration.test.ts                     # formatDuration/getElapsedSeconds edge cases (sub-minute, hours, zero)
    |-- streak.test.ts                       # computeStreakDays (consecutive days, gap resets, same-day dedupe, today-not-yet-worked-out-but-yesterday-was)
    |-- effortRating.test.ts                 # label/visual lookup for all 5 levels + null/not-rated
    |-- monthCalendar.test.ts                # NEW (Round 2): buildMonthGrid padding/leap-year/month-length cases, shiftMonth year rollover
    |-- sessionBreakdown.test.ts              # NEW (Round 3): exerciseCount/workingSeconds/restingSeconds across gap patterns, single-set edge case
    |-- ActiveSession.test.tsx               # extended (Round 2): one-tap Finish (no summary screen), timer freezes at workout-complete, persistent top timer
    |-- HistoryScreen.test.tsx                # extended (Round 2): calendar marks worked-out days, tapping a day shows its session(s), larger type / no volume; Round 3: shows exercise count/volume+unit/resting/working per selected session
    `-- scaffold.test.tsx                     # extended if history/dashboard smoke-test mocks need new fields
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

### Round 2 Post-Design Constitution Check

- Beginner-first: PASS. One-tap Finish removes a step rather than adding one; the persistent timer and calendar are passive information, not new required interactions.
- Offline-first SQLite: PASS. `listCompletedSessionsInRange` is local-only, reusing the existing schema with no migration; the calendar and chart are pure client-side presentations of already-local data.
- Approved stack: PASS. No new dependencies — the month calendar is built from plain `View`/`Pressable`/`Text`, no date/calendar library added.
- Simplicity: PASS. Zero new schema surface in Round 2. `monthCalendar.ts` is deliberately minimal (grid generation only); the tappable chart reuses data already fetched for the existing chart.
- Testable increment: PASS. `monthCalendar.ts`'s grid/month-shift logic and `dashboardStats.ts`'s per-day `setCount` addition are pure and unit-tested; each Round 2 user story (US1 amendment, US3 amendment, US5, US6, US7) is independently testable per spec.md.

### Round 3 Post-Design Constitution Check

- Beginner-first: PASS. Purely additional read-only detail on a screen the user already opens deliberately; no new required interaction.
- Offline-first SQLite: PASS. `listSetLogsForSession` reuses an existing repository method against local data; no new table, no network.
- Approved stack: PASS. No new dependencies.
- Simplicity: PASS. Zero schema change — every new figure (exercise count, volume unit, resting/working time) is computed from data already persisted for other reasons in this same spec.
- Testable increment: PASS. `computeSessionBreakdown` is a pure function with explicit unit tests covering gap-summing and the single-set edge case (User Story 7, Acceptance Scenario 5).
