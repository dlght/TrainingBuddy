---

description: "Task list for Session Duration, Streaks, and Effort Rating implementation"

---

# Tasks: Session Duration, Streaks, and Effort Rating

**Input**: Design documents from `/specs/005-session-stats-and-media/`

**Prerequisites**: plan.md, spec.md

**Tests**: Every task touching SQLite persistence, migrations, or duration/streak/rating logic includes a test. UI-only display wiring uses manual Expo validation where automated coverage would not add meaningful confidence, per plan.md.

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

- [x] T001 Confirm no new packages are required — duration formatting, streak calculation, and the rating picker all reuse existing components, the existing interval-timer pattern (`useRestTimer`), and existing repository methods

---

## Phase 2: Foundational — `workout_sessions.rating` Migration (blocks US4 only)

**Purpose**: Add a nullable rating column to `workout_sessions` and the write path to persist it at finish time

**CRITICAL**: Follow the `ensureWorkoutExerciseTargetWeight`/`ensureWorkoutExerciseSetPlans` self-healing pattern in `src/db/migrate.ts` exactly: check live schema via `PRAGMA table_info`, never edit `initialMigrationSql` in place for a table that may already exist on a device. Per plan.md, this column has no DB-level `CHECK` constraint — range (1-5) is validated in application code.

- [x] T002 Add `rating` (nullable integer) to the `workoutSessions` table in `src/db/schema.ts`
- [x] T003 Write `ensureWorkoutSessionRating(database)` in `src/db/migrate.ts`: check `PRAGMA table_info(workout_sessions)` for a `rating` column; if absent, run `ALTER TABLE workout_sessions ADD COLUMN rating INTEGER;`; call it from `runMigrations` alongside the existing self-healing checks
- [x] T004 Add `rating: number | null` to `WorkoutSession` in `src/models/session.ts`
- [x] T005 [P] Integration test in `tests/integration/workoutSessionRating.test.ts`: run the migration against a real SQLite engine simulating a device with pre-existing `workout_sessions` rows (no `rating` column), confirm existing rows survive with `rating = null`, confirm the migration is a no-op on a second run (idempotent)
- [x] T006 Add `completeSession(sessionId, { rating, endedAt })` to `src/db/repositories/sessionRepository.ts` (new method — `UPDATE workout_sessions SET status = 'completed', ended_at = ?, rating = ? WHERE id = ? AND status = 'active'`; the existing `updateSessionStatus` keeps handling discard, unchanged); add `rating` to `CompletedSessionSummary` and its `SELECT` in `listCompletedSessions`
- [x] T007 Update `completeSession(sessionId, options?: { rating?: number | null })` in `src/features/sessions/sessionService.ts` (both the `createSessionService` factory and the runtime singleton) to call the new repository method, passing `options?.rating ?? null` through

**Checkpoint**: `rating` column and its write path verified against real SQLite — User Story 4 implementation can now begin

---

## Phase 3: Foundational — Duration Pure Functions (blocks US1, US2)

**Purpose**: One shared, unit-tested source of truth for turning two ISO timestamps into a display string, reused by the finish screen and history

- [x] T008 [P] Create `src/features/sessions/duration.ts`: `getElapsedSeconds(startedAtIso, referenceIso)` and `formatDuration(totalSeconds)` (sub-minute → `"0m"`/`"45s"`, minutes → `"12m 30s"`, hours → `"1h 05m"`)
- [x] T009 [P] Unit test `tests/unit/duration.test.ts`: sub-minute, exact minutes, hours + minutes, zero-duration, and an invalid/negative-input guard

**Checkpoint**: Duration helper ready — User Stories 1 and 2 can now begin

---

## Phase 4: User Story 1 - Total Workout Duration on the Finish Screen (Priority: P1)

**Goal**: The workout-complete card shows a live, big centered elapsed-time readout that counts up before Finish is tapped; tapping Finish shows a new "session summary" state with the final persisted duration before navigating away.

**Independent Test**: Start a session, log at least one set, wait a measurable amount of time, tap Finish. Confirm the complete-state screen shows a large, centered, live-updating elapsed time, and that finishing shows a summary screen with the final duration before leaving.

### Tests for User Story 1

- [x] T010 [P] [US1] Unit test `tests/unit/useElapsedSeconds.test.ts` (fake timers): ticks once per second while `isRunning`, stops ticking once `isRunning` is false, computes correct elapsed seconds from a fixed `startedAt`
- [x] T011 [P] [US1] Extend `tests/unit/ActiveSession.test.tsx`: the complete card renders a live duration readout that increases over time (fake timers); after tapping Finish, a "session summary" state renders showing the final persisted duration; a "Done" button performs the navigation previously asserted directly on "Finish session"

### Implementation for User Story 1

- [x] T012 [US1] Create `src/features/sessions/useElapsedSeconds.ts`: a ticking hook (1s `setInterval`, cleaned up the same way as `useRestTimer`) returning live elapsed seconds since a given `startedAt` while `isRunning`
- [x] T013 [US1] In `app/workouts/[workoutId]/session.tsx`, render `formatDuration` of the live `useElapsedSeconds` value in large, centered text on the workout-complete card (`styles.completeCard`)
- [x] T014 [US1] Add a `sessionSummary` state to `app/workouts/[workoutId]/session.tsx`: on a successful `finishSession`, instead of immediately navigating, compute the final duration from the returned session's `startedAt`/`endedAt` (via `duration.ts`), store it, and render a new summary block (title, large centered final duration, a "Done" button); "Done" performs the existing `router.replace(/workouts/${workoutId})` navigation that used to fire immediately on Finish
- [ ] T015 [US1] Validate manually in Expo: start a session, watch the complete-card duration count up, finish, confirm the session-summary screen shows a static final duration close to what was last displayed live — with network disabled

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 5: User Story 2 - Workout Duration Shown in History (Priority: P2)

**Goal**: Each session card in History shows that session's duration, computed from its existing `startedAt`/`endedAt`.

**Independent Test**: Finish a workout, open History, and confirm the session's card shows its duration alongside its existing details.

### Tests for User Story 2

- [x] T016 [P] [US2] Extend history-screen test coverage (`tests/unit/scaffold.test.tsx` or a new `tests/unit/HistoryScreen.test.tsx`): each rendered session card shows a duration string derived from its `startedAt`/`endedAt`

### Implementation for User Story 2

- [x] T017 [US2] In `app/history/index.tsx`, call `formatDuration(getElapsedSeconds(session.startedAt, session.endedAt))` per session card and render it alongside the existing set-count/volume details
- [ ] T018 [US2] Validate manually in Expo: finish a couple of workouts of different lengths, open History, confirm each card shows a plausible duration — with network disabled

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 6: User Story 3 - Workout Streak on Dashboard and Finish Screen (Priority: P2)

**Goal**: A computed (not stored) day-streak is shown on the dashboard and on the finish/session-summary screen, reusing the existing `listCompletedSessionsSince` repository method.

**Independent Test**: Complete a workout today and confirm the dashboard shows a 1-day streak. Complete another workout the next calendar day and confirm it shows 2, on both the dashboard and that session's finish screen. Skip a day and confirm the streak resets to 1 on the next workout.

### Tests for User Story 3

- [x] T019 [P] [US3] Unit test `tests/unit/streak.test.ts` for `computeStreakDays`: consecutive days count up correctly; a gap resets to the post-gap run; multiple sessions on the same day dedupe to one day; "worked out yesterday but not yet today" still reports the pre-existing streak (not reset to 0); no sessions ever reports 0
- [x] T020 [P] [US3] Integration test in `tests/integration/streakService.test.ts` (real SQLite): `streakService` against seeded completed sessions spanning several calendar days returns the expected streak length, and excludes discarded/active sessions

### Implementation for User Story 3

- [x] T021 [US3] Create `src/features/progress/streak.ts`: pure `computeStreakDays(endedAtIsoList, todayLocalDateIso)`
- [x] T022 [US3] Create `src/features/progress/streakService.ts`: wraps `sessionRepository.listCompletedSessionsSince(userId, ~60-day-ago ISO)`, buckets results to local calendar days, calls `computeStreakDays`, exposes `getCurrentStreak()` (runtime singleton, mirrors `historyService`'s shape)
- [x] T023 [US3] In `app/index.tsx`, fetch the current streak inside the existing dashboard-stats `useFocusEffect` and display it (e.g. "3-day streak") near the existing stats
- [x] T024 [US3] In `app/workouts/[workoutId]/session.tsx`, after `finishSession` succeeds, call `streakService.getCurrentStreak()` and include it in the `sessionSummary` state from T014, rendering it in the summary block
- [ ] T025 [US3] Validate manually in Expo: complete workouts across consecutive calendar days (adjusting device date or seeding sessions with different `endedAt` values) and confirm the streak updates correctly on both the dashboard and the finish summary — with network disabled

**Checkpoint**: User Stories 1-3 all functional independently

---

## Phase 7: User Story 4 - Rate Workout Effort 1-5 on Finish (Priority: P3)

**Goal**: An optional, once-per-session 1-5 effort rating is captured on the complete card, persisted, and shown with a plain-language label (not a bare number) in history and in the session summary.

**Independent Test**: Finish a workout, select an effort rating from the 5 labeled options, confirm the session saves and that rating appears later in history. Separately, finish a workout without selecting a rating and confirm it still saves, showing an honest "not rated" state.

**Depends on**: Phase 2 (`rating` column and `completeSession` write path)

### Tests for User Story 4

- [x] T026 [P] [US4] Unit test `tests/unit/effortRating.test.ts`: label/visual lookup is correct for all 5 levels (1 "In my sleep" … 5 "Impossible"); `null`/undefined maps to a "not rated" result
- [x] T027 [P] [US4] Extend `tests/unit/ActiveSession.test.tsx`: `EffortRatingPicker` renders 5 labeled options on the complete card; selecting one and finishing passes that rating into `sessionService.completeSession`; finishing without selecting one still succeeds with no rating passed
- [x] T028 [P] [US4] Extend history-screen tests: a session with a rating renders its label/icon; a session without one renders an explicit "not rated" state

### Implementation for User Story 4

- [x] T029 [US4] Create `src/features/sessions/effortRating.ts`: `RATING_OPTIONS` (value, label, visual) for the 5 exact labels from spec.md, plus `getEffortRatingMeta(rating: number | null)`, shared by the picker and history so wording can't drift
- [x] T030 [US4] Create `src/features/sessions/EffortRatingPicker.tsx`: 5 selectable chips built from `RATING_OPTIONS`, controlled `selectedRating`/`onSelect` props, no option selected by default
- [x] T031 [US4] In `app/workouts/[workoutId]/session.tsx`: render `EffortRatingPicker` on the workout-complete card (alongside the duration readout from US1); pass the selected rating into `finishSession`'s call to `sessionService.completeSession(sessionId, { rating: selectedRating })`; include the chosen rating's label (or "not rated") in the `sessionSummary` render from T014
- [x] T032 [US4] In `app/history/index.tsx`, render each session's rating via `getEffortRatingMeta`, with an explicit "not rated" state when `rating` is `null`
- [ ] T033 [US4] Validate manually in Expo: finish separate workouts selecting each of the 5 ratings in turn and confirm the label appears correctly in the session summary and later in History; finish one more workout without selecting a rating and confirm it saves and shows "not rated" — with network disabled

**Checkpoint**: All 4 user stories independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [x] T034 [P] Run `npx tsc --noEmit` and fix any type errors surfaced by the `rating`/duration/streak changes rippling through consumers
- [x] T035 [P] Run the full Jest suite (`npm test`) and extend the `TestDatabase` mock (`tests/helpers/testDatabase.ts`) for the new `rating` column and `completeSession` write path wherever an existing integration test now touches it
- [x] T036 Run the `workout_sessions.rating` migration test against a simulated pre-existing device before considering T003 done (cross-reference T005)
- [ ] T037 End-to-end manual validation in Expo: start a session, watch duration tick on the complete card, select a rating, finish, confirm the session summary shows duration + streak + rating, confirm History reflects all three for that session — with network disabled
- [ ] T038 Update `specs/005-session-stats-and-media/spec.md` status from Draft to Delivered once all checkpoints pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational — rating migration (Phase 2)**: Depends on Setup — BLOCKS User Story 4 only
- **Foundational — duration helper (Phase 3)**: Depends on Setup — BLOCKS User Stories 1 and 2
- **User Story 1 (Phase 4)**: Depends on Phase 3
- **User Story 2 (Phase 5)**: Depends on Phase 3
- **User Story 3 (Phase 6)**: No schema dependency; the finish-screen half (T024) touches the same `sessionSummary` state introduced in T014 (US1), so land Phase 4 first in practice even though Phase 6 has no hard blocking dependency otherwise
- **User Story 4 (Phase 7)**: Depends on Phase 2; the finish-screen half (T031) also touches the `sessionSummary`/complete-card UI from T013/T014 (US1)
- **Polish (Phase 8)**: Depends on all desired stories being complete

### Parallel Opportunities

- Phase 2 (rating migration) and Phase 3 (duration helper) touch disjoint files and can proceed in parallel
- User Story 2 (history duration) has no dependency on User Stories 3 or 4 and can proceed in parallel with them once Phase 3 is done
- User Story 3's data-layer tasks (T019-T022, streak calculation/service) can proceed in parallel with User Story 4's data-layer tasks (T026, T029-T030, effort rating), since they touch entirely different files; their respective session-screen UI tasks (T024, T031) should land sequentially since both edit `app/workouts/[workoutId]/session.tsx`'s complete-card/summary block
- Within each story, [P]-marked test tasks can run in parallel; implementation tasks touching the same file are sequential

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (Setup) and Phase 3 (duration helper)
2. Complete Phase 4 (User Story 1 — live duration + session summary state, the most-requested single item)
3. STOP and VALIDATE in Expo, offline: finish a workout and confirm the big centered duration on both the complete card and the summary screen
4. Demo if ready

### Incremental Delivery

Ship in priority order (P1 → P2 x2 → P3), demoing after each checkpoint. Phase 2 (rating migration) only blocks User Story 4 and can be built well ahead of it in parallel with everything else.
