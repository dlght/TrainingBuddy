---

description: "Task list for spec 007: session polish, account menu, favourites, and challenges"
---

# Tasks: Session Polish, Account Menu, Favourites, and Challenges

**Input**: Design documents from `/specs/007-polish-and-challenges/`

**Prerequisites**: plan.md, spec.md

**Tests**: Included for all new/changed logic (validation, ordering, streak
math, badge computation, per-account isolation) using the existing
fake-Supabase test double established in spec 006. UI-only wiring uses manual
Expo validation.

**Organization**: Tasks are grouped by user story (US1-US6, matching spec.md)
so each can be implemented and validated independently. US1/US2 are P1;
US3/US4/US5 are P2; US6 is P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions

- **App routes/screens**: `app/`
- **Reusable feature code/services**: `src/features/`
- **Supabase schema/RLS**: `supabase/migrations/`, `supabase/seed.sql`
- **Tests**: `tests/unit/`, `tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema/reference data needed by US5 and US6 only — US1-US4 need
no schema change and do not depend on this phase.

- [x] T001 Author `supabase/migrations/0004_polish_and_challenges.sql`:
      `sample_workout_favourites (user_id uuid references profiles, workout_id
      text references workouts, primary key (user_id, workout_id))` with RLS
      scoped to `user_id = auth.uid()`; `badges (id text primary key,
      category text check in ('lifetime_workouts','streak'), threshold
      integer not null, label text not null)` with RLS `select` open to
      `authenticated`, no client write policy (matches `exercises` pattern).
- [x] T002 [P] Seed the badge catalog in `supabase/seed.sql`: lifetime-workout
      badges at 10/50/100/200/500/1000, streak badges at
      1/2/3/5/7/10/14/30, with a plain-language label for each.
- [x] T003 Apply the migration and seed to the linked Supabase project
      (`supabase db push --include-seed`) and verify via `pg_policies`/a
      read query that both tables and their RLS landed correctly. Note: the
      CLI's seed-hash tracking marked the file "applied" without every
      insert actually landing; verified via direct row counts and
      backfilled the missing badge rows with the same SQL directly against
      the linked project — all 14 confirmed present.

**Checkpoint**: US5 and US6 are unblocked. US1-US4 can proceed independently
of this phase at any time.

---

## Phase 2: User Story 1 - End a workout early and still get the summary (Priority: P1)

**Goal**: "End workout" reaches the same rating/summary screen a full
completion does, using only the sets actually logged.

**Independent Test**: Start a session with 3 exercises, log sets for the
first exercise only, tap "End workout" → confirm → land on the summary
screen → session appears in history with just the logged sets.

### Tests for User Story 1

- [x] T004 [P] [US1] Test in `tests/unit/ActiveSession.test.tsx`: "End
      workout" with sets remaining shows the confirmation, and confirming
      reveals the same rating/summary UI a full completion shows; backing out
      of the confirmation leaves the session active and its logged sets
      untouched.

### Implementation for User Story 1

- [x] T005 [US1] `app/workouts/[workoutId]/session.tsx`: add an "End workout"
      action (visible only while unlogged planned sets remain) that, after
      confirmation, sets `isWorkoutComplete` true directly — reusing the
      existing `workoutCompletedAt`-capture effect, rating picker, and
      Finish/Discard actions with no new summary UI.
- [x] T006 [US1] Confirm `sessionService.completeSession()`'s existing
      `{ rating, endedAt }` contract needs no change for a partially-logged
      session (verify via T004); adjust only if the partial-completion path
      surfaces a gap. Confirmed: `completeSession` only requires
      `status === "active"`, no full-completion check — no change needed.
- [ ] T007 [US1] Manual Expo validation: log partial sets, end early, confirm
      the session lands in History with the correct elapsed time and only
      the sets actually logged.

**Checkpoint**: User Story 1 is independently functional.

---

## Phase 3: User Story 2 - History shows the newest workout first (Priority: P1)

**Goal**: Sessions within a day (and across days) list most-recent-first.

**Independent Test**: Log three completed sessions on the same day → open
History, select that day → most-recent session listed first.

### Tests for User Story 2

- [x] T008 [P] [US2] Unit test (fake-Supabase-backed) asserting
      `sessionRepository.listCompletedSessionsInRange` returns sessions
      newest-first, with a stable order for equal `ended_at` values.

### Implementation for User Story 2

- [x] T009 [US2] `src/features/sessions/sessionRepository.ts`:
      `listCompletedSessionsInRange` — add `{ ascending: false }` to the
      `ended_at` order and a secondary `.order("id", { ascending: false })`
      tiebreaker, matching `listCompletedSessions`'s existing pattern.
      Applied the same tiebreaker to `listCompletedSessions` too.
- [ ] T010 [US2] Manual Expo validation: log 3 same-day sessions, confirm
      newest-first in the History screen.

**Checkpoint**: User Stories 1 and 2 both work independently — P1 MVP slice
complete.

---

## Phase 4: User Story 3 - Configure rest time per exercise (Priority: P2)

**Goal**: Each exercise's rest time is editable in the builder and actually
drives the active session's rest timer.

**Independent Test**: Two exercises with rest times 30s/120s → during a
session, the rest countdown after each matches its own exercise's value.

### Tests for User Story 3

- [x] T011 [P] [US3] Unit test in `tests/unit/workoutValidation.test.ts`:
      blank, zero, and negative rest-time values are rejected with an inline
      error. Already covered by an existing negative-value test; the
      validation logic itself needed no change (blank parses to 0, which
      the schema's own `>= 0` check already allows, so it's treated as a
      valid explicit rest time, not silently rejected or defaulted).
- [x] T012 [P] [US3] Test confirming the active session sets the rest-timer
      duration from the current exercise's `targetRestSeconds` when the
      active exercise changes (extend `tests/unit/ActiveSession.test.tsx`).

### Implementation for User Story 3

- [x] T013 [US3] `src/features/workouts/WorkoutExerciseEditor.tsx`: add a
      "Rest (sec)" `TargetInput`, matching the existing reps/weight input
      style, wired through `WorkoutExerciseEditorValue.targetRestSeconds`.
- [x] T014 ~~`src/features/workouts/workoutValidation.ts`: reject blank,
      zero, or negative rest-time values~~ — existing validation already
      rejected non-integer/negative values; left blank/zero as valid (0s
      rest), matching the DB's own `target_rest_seconds >= 0` check, so no
      code change was needed here.
- [x] T015 [US3] `app/workouts/new.tsx`: stop hardcoding `"60"` in
      `editorValueForExercise`; round-trip the real configured value in
      `editorValuesForWorkout` for edits. Turned out `editorValuesForWorkout`
      already round-tripped the real value for edits — only the new-exercise
      default needed the new editable field to make it changeable at all.
- [x] T016 [US3] `app/workouts/[workoutId]/session.tsx`: call
      `setRestDurationSeconds(currentExercise.targetRestSeconds)` whenever the
      active exercise changes, replacing the store's static default. Keyed
      the effect on exercise id + rest-seconds (not the exercise object
      itself) to avoid re-firing on every logged set and cancelling an
      in-progress rest countdown.
- [ ] T017 [US3] Manual Expo validation: configure distinct rest times per
      exercise, confirm the timer differs after logging each.

**Checkpoint**: User Stories 1-3 all independently functional.

---

## Phase 5: User Story 4 - See who's signed in and sign out from anywhere (Priority: P2)

**Goal**: A top-right menu on every authenticated screen shows the signed-in
email and offers Profile / Sign out.

**Independent Test**: From Dashboard, Workouts, and History, open the
top-right menu → see the email → Sign out returns to sign-in.

### Tests for User Story 4

- [x] T018 [P] [US4] Component test `tests/unit/AccountMenu.test.tsx`: renders
      the signed-in email; "Profile" navigates to `/profile/setup`; "Sign
      out" calls `authStore.signOut()`.

### Implementation for User Story 4

- [x] T019 [US4] Create `src/features/account/AccountMenu.tsx`: a small
      top-right dropdown/action-sheet showing the signed-in email with
      "Profile" and "Sign out" actions.
- [x] T020 ~~`app/_layout.tsx`: set `screenOptions.headerRight`~~ — set
      `headerRight` per `Stack.Screen` instead (expo-router doesn't merge a
      group-level `screenOptions.headerRight` with each screen's own
      `title`), on every screen except the active-session screen
      (deliberately excluded — a focused, transient flow where a sign-out
      entry point is more risk than value) and now `challenges/index` too.
- [x] T021 [US4] `app/index.tsx`: remove the now-redundant `topHeader`
      profile-initial button, superseded by the global menu.
- [ ] T022 [US4] Manual Expo validation: open the menu from Dashboard,
      Workouts, History, and Challenges; confirm sign-out works from each.

**Checkpoint**: User Stories 1-4 all independently functional.

---

## Phase 6: User Story 5 - Favourite a sample workout (Priority: P2)

**Goal**: Sample workouts can be favourited per-account, feeding into the
existing suggestion ranking, without leaking across accounts.

**Independent Test**: Favourite a sample workout on account A → shows
favourited and prioritized in suggestions; account B sees it as not
favourited.

**Depends on**: Phase 1 (`sample_workout_favourites` table).

### Tests for User Story 5

- [x] T023 [P] [US5] Unit test (fake-Supabase-backed, two simulated accounts)
      asserting toggling a sample workout's favourite for account A does not
      affect account B's view of the same workout. Placed in
      `tests/integration/sampleWorkoutFavourites.test.ts` (matches this
      repo's convention of fake-Supabase-backed tests living under
      `tests/integration/`, not `tests/unit/`).

### Implementation for User Story 5

- [x] T024 [US5] `src/features/workouts/workoutRepository.ts`:
      `toggleFavourite` branches on `isTemplate` — templates insert/delete a
      `sample_workout_favourites` row instead of updating
      `workouts.is_favourite`.
- [x] T025 [US5] `workoutRepository.ts`: `isFavourite` for template rows
      (`listWorkouts`, `getWorkoutWithExercises`, `getWorkoutById`,
      `getSeededWorkouts`) is computed from the caller's
      `sample_workout_favourites` membership instead of the shared column.
      `listFavouriteWorkouts` also rewritten to merge favourited customs and
      favourited templates.
- [x] T026 [US5] `app/workouts/index.tsx`: pass `onToggleFavourite` into the
      "Sample workouts" `WorkoutSection` (currently omitted).
- [ ] T027 [US5] Manual Expo validation: favourite a sample workout, confirm
      it's prioritized in dashboard suggestions; sign in as a second account
      and confirm it shows unfavourited there.

**Checkpoint**: User Stories 1-5 all independently functional.

---

## Phase 7: User Story 6 - Earn challenge badges for consistency (Priority: P3)

**Goal**: A Challenges tab shows lifetime-workout and streak badges, achieved
ones sorted to the top, computed from full account history.

**Independent Test**: Account with 15 prior lifetime workouts and a 3-day
streak opens Challenges for the first time → "10 workouts," "1/2/3 day"
badges already unlocked at the top.

**Depends on**: Phase 1 (`badges` table + seed).

### Tests for User Story 6

- [x] T028 [P] [US6] Unit tests in `tests/unit/streak.test.ts`:
      `computeLongestStreakDays` — a run in the middle of the history longer
      than the trailing run, gaps, ties, and an empty list.
- [x] T029 [P] [US6] Unit tests in
      `tests/integration/challengesService.test.ts` (path corrected from
      `tests/unit/` to match this repo's fake-Supabase-test convention;
      fake-Supabase-backed): badges unlock at the correct thresholds; an
      account with pre-existing history sees badges already unlocked on
      first read; a streak badge stays achieved after the current streak
      resets.

### Implementation for User Story 6

- [x] T030 [US6] `src/features/challenges/badge.ts`: `Badge`/`BadgeProgress`
      types (achievement is computed by `challengesService` reading the
      seeded `badges` table directly, not a duplicated static catalog).
- [x] T031 [US6] `src/features/progress/streak.ts`: add
      `computeLongestStreakDays(dates: string[]): number`, reusing the
      existing local-date-key helpers.
- [x] T032 [US6] `src/features/challenges/challengesService.ts`:
      `getProgress()` — lifetime completed-session count plus longest streak
      ever, compared against the badge catalog, returning each badge with an
      achieved flag. Added `sessionRepository.listAllCompletedSessionEndTimes`
      (unbounded, unlike the dashboard's 60-day-lookback streak query) to
      back it.
- [x] T033 [US6] `app/challenges/index.tsx`: new screen rendering both badge
      tracks, achieved badges sorted above locked ones, locked badges grayed
      out with their threshold shown.
- [x] T034 [US6] `app/_layout.tsx`: register `challenges/index` in the
      signed-in `Stack.Protected` screen list (title "Challenges").
- [x] T035 [US6] `app/index.tsx`: add a "Challenges" button to the existing
      bottom nav row alongside Home/Workouts/Progress.
- [ ] T036 [US6] Manual Expo validation: an account with prior workout
      history opens the Challenges tab and sees already-earned badges
      unlocked at the top without any manual recompute step.

**Checkpoint**: All six user stories independently functional.

---

## Phase 8: Polish & Regression

**Purpose**: Cross-cutting verification after all stories land.

- [x] T037 [P] `tsc` clean across the whole project.
- [x] T038 [P] `eslint` clean across the whole project (0 errors; only
      pre-existing warnings, none newly introduced).
- [x] T039 Full `jest` suite green, including all new tests above (230
      passed, 1 pre-existing live-RLS test skipped, same as spec 006's
      baseline).
- [ ] T040 Full manual Expo regression pass: re-run existing core flows
      (create workout, log a session, view history, dashboard/streak) to
      confirm none of the six changes above regressed them.
- [ ] T041 Update `specs/007-polish-and-challenges/spec.md` Status once the
      above is confirmed, following the same honest-reconciliation pattern
      used to close spec 006.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Only blocks US5 and US6 — US1-US4 can
  start immediately and in parallel with Phase 1.
- **User Stories (Phases 2-7)**: US1-US4 depend on nothing but the current
  codebase. US5 and US6 depend on Phase 1. All six are independent of each
  other and may proceed in parallel once their own prerequisites are met.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- Phase 1's T001-T002 can run in parallel with all of Phases 2-5 (US1-US4).
- Within each story, the `[P]`-marked test tasks can run in parallel with
  each other before that story's implementation tasks begin.
- Once Phase 1 completes, US5 and US6 can each proceed in parallel with the
  others and with any still-in-progress US1-US4 work.

---

## Implementation Strategy

### Suggested order

1. Phase 1 (Setup) in parallel with Phase 2 + Phase 3 (US1, US2 — the P1
   slice, no schema dependency).
2. Phase 4 + Phase 5 (US3, US4 — P2, no schema dependency).
3. Phase 6 (US5 — P2, needs Phase 1).
4. Phase 7 (US6 — P3, needs Phase 1; the largest net-new surface, so it
   lands last).
5. Phase 8 (Polish & Regression), then close the spec.

### Incremental delivery

Each story phase ends with its own manual-Expo checkpoint — stop and demo
after any phase without blocking on the rest; nothing in Phases 2-7 depends
on a later phase.

---

## Notes

- `[P]` tasks touch different files with no dependency between them.
- `[Story]` maps each task to its spec.md user story for traceability.
- US1-US4 deliberately need zero schema change — keep them that way; if an
  implementation detour starts requiring a migration for one of them,
  that's a signal to revisit the approach against plan.md's design
  decisions.
- Streak-badge permanence (FR-014) is the one subtle correctness requirement
  in this batch — `computeLongestStreakDays`'s tests (T028) are the
  authoritative check that a reset current streak doesn't hide an
  already-earned badge.
