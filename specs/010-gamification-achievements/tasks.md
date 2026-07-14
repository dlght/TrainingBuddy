---

description: "Task list for spec 010: gamification achievement badges"
---

# Tasks: Gamification - Achievement Badges

**Input**: Design documents from `/specs/010-gamification-achievements/`

**Prerequisites**: plan.md, spec.md

**Tests**: Included throughout — every user story here touches persisted
aggregation logic (volume sums, best-month grouping, distinct-session counts,
PR detection, ratio comparisons), which is exactly the kind of pure/data logic
spec 001-009's convention covers with Jest unit tests against the existing
fake-Supabase test double. No story in this spec is UI-only, so none skip
straight to manual-only validation.

**Organization**: Tasks are grouped by user story (US1-US5, matching
spec.md). US1 is P1; US2/US3 are P2; US4/US5 are P3. US5 depends on US4
(needs `personal_records` to exist); US1-US3 are otherwise independent of
each other.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions

- **Reusable feature code/services**: `src/features/challenges/`, `src/features/sessions/`
- **Domain models**: `src/models/`
- **Supabase schema**: `supabase/migrations/`, `supabase/seed.sql`
- **Tests**: `tests/unit/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Widen the `badges` catalog schema so every later story has
somewhere to seed its rows. US1-US3 need nothing beyond this phase; US4/US5
need the separate Phase 5 migration too.

- [x] T001 Author `supabase/migrations/0007_badge_categories.sql`: widen
      `badges.category`'s check constraint to add `total_volume_kg`,
      `monthly_workout_count`, `exercise_session_count` (leave `pr_count` and
      `bodyweight_ratio` for Phase 5's migration, since those need
      `personal_records` to exist first); add nullable `exercise_id text
      references exercises(id)` and `ratio_multiplier numeric check
      (ratio_multiplier is null or ratio_multiplier > 0)` columns; replace the
      old `unique (category, threshold)` table constraint with the two
      partial unique indexes from plan.md Design Decision 7
      (`badges_no_exercise_uq` on `(category, threshold) where exercise_id is
      null`, `badges_with_exercise_uq` on `(category, threshold,
      exercise_id) where exercise_id is not null`).
- [x] T002 In the same migration, seed the US1-US3 badge rows: `('first-workout',
      'lifetime_workouts', 1, 'First workout')`; `('streak-365', 'streak', 365,
      '365 day streak')`; `('monthly-10', 'monthly_workout_count', 10, '10
      workouts in a month')`; `('volume-10000', 'total_volume_kg', 10000,
      '10,000kg lifted')`; `('volume-1000000', 'total_volume_kg', 1000000, '1
      million kg lifetime')`; `('bench-sessions-100', 'exercise_session_count',
      100, '100 bench sessions', exercise_id = 'barbell-bench-press')`.
- [x] T003 Mirror the same catalog rows (and the schema shape, for fresh
      resets) in `supabase/seed.sql`'s existing `badges` insert block.
- [x] T004 Apply the migration to the linked Supabase project (`supabase db
      push`) and verify via a read query that the constraint, new columns,
      and seed rows landed correctly.

**Checkpoint**: US1, US2, and US3 are all unblocked. US4/US5 still need
Phase 5's migration before they can be built.

---

## Phase 2: User Story 1 - New milestones on the existing badge track (Priority: P1) MVP

**Goal**: "First workout," "365-day streak," and "10 workouts in a month" show
correct achieved/not-achieved state on the Challenges tab, computed live like
every existing badge.

**Independent Test**: Complete one session as a fresh test account and
confirm "First workout" is achieved; complete 10 sessions within one
calendar month (and separately, sessions spread across months) and confirm
the monthly badge behaves as described in spec.md's Acceptance Scenario 2.

### Tests for User Story 1

- [x] T005 [P] [US1] Unit test in `tests/unit/challengesService.test.ts` (or
      a new `bestMonthlyWorkoutCount.test.ts` if the grouping logic is
      extracted as its own pure function): given a list of completed-session
      end timestamps spread across several calendar months, the "best month"
      value equals the count in the fullest month, not the most recent one —
      covers spec.md's monotonic "best month ever" design decision.
- [x] T006 [P] [US1] Unit test confirming "First workout" achieves the
      instant `lifetimeWorkoutCount >= 1` (already implied by the existing
      `toBadgeProgress` comparison, but assert it explicitly now that
      threshold 1 exists in the catalog).

### Implementation for User Story 1

- [x] T007 [US1] Add `"monthly_workout_count"` to `BadgeCategory` in
      `src/features/challenges/badge.ts`.
- [x] T008 [US1] Add a pure `computeBestMonthlyWorkoutCount(endedAtList:
      string[]): number` function (new file, e.g.
      `src/features/challenges/monthlyWorkoutCount.ts`, mirroring how
      `computeLongestStreakDays` already lives in its own
      `src/features/progress/streak.ts`): group `endedAt` timestamps by
      `YYYY-MM`, return the size of the largest group (0 if none).
- [x] T009 [US1] Wire `computeBestMonthlyWorkoutCount` into
      `challengesService.ts`'s `getProgress()` (reuses the `endedAtList`
      already being fetched for `lifetimeWorkoutCount`/`longestStreakDays` —
      no new query) and extend `toBadgeProgress`'s dispatch to handle
      `monthly_workout_count`.
- [x] T010 [US1] Manually validate in Expo: complete a first session on a
      fresh test account and confirm "First workout" flips to achieved on
      the Challenges tab; back-date/complete enough sessions (or adjust test
      data) to confirm the monthly badge and the new 365-day streak tier
      render correctly alongside the existing badges.

**Checkpoint**: User Story 1 is fully functional and independently
verifiable. US2-US5 are not required for this story to ship on its own.

---

## Phase 3: User Story 2 - Lifetime volume badges (Priority: P2)

**Goal**: "10,000kg lifted" and "1,000,000kg lifetime" show correct progress
based on the sum of `reps * weight` across every logged, non-discarded set.

**Independent Test**: Log enough weighted sets for a test account to cross
10,000kg total and confirm the badge achieves; confirm bodyweight-only sets
(no weight) don't affect the total.

### Tests for User Story 2

- [x] T011 [P] [US2] Unit test for a new pure `sumLifetimeVolumeKg(sets:
      {reps: number; weight: number | null}[]): number` function: weighted
      sets contribute `reps * weight`; null-weight (bodyweight) sets
      contribute 0; empty input returns 0.

### Implementation for User Story 2

- [x] T012 [US2] Add `"total_volume_kg"` to `BadgeCategory` in `badge.ts`.
- [x] T013 [US2] Add `sumLifetimeVolumeKg` (e.g. in a new
      `src/features/challenges/lifetimeVolume.ts`, or alongside
      `progressCalculations.ts`'s existing volume helpers if that reads more
      naturally as a shared home).
- [x] T014 [US2] Extend `challengesService.ts`'s `getProgress()` to fetch
      every completed session's set logs (reps, weight) in the same
      `Promise.all` as the existing queries, run `sumLifetimeVolumeKg`, and
      extend `toBadgeProgress` to handle `total_volume_kg`.
- [x] T015 [US2] Manually validate in Expo: log enough weighted sets to pass
      10,000kg cumulative and confirm the badge achieves; confirm a
      bodyweight-only test account still shows 0kg / not achieved, no error.

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 4: User Story 3 - Exercise-specific session count badge (Priority: P2)

**Goal**: "100 bench sessions" tracks the number of distinct sessions
containing at least one Barbell Bench Press set, not the number of sets.

**Independent Test**: Log Barbell Bench Press across several distinct
sessions (including a session with multiple bench sets) and confirm the
badge's progress counts sessions, not sets.

### Tests for User Story 3

- [x] T016 [P] [US3] Unit test for a new pure `countDistinctSessionsForExercise(
      setLogs: {sessionId: string; exerciseId: string}[], exerciseId: string):
      number`: multiple sets for the target exercise in the same session
      count once; sets for other exercises are ignored.

### Implementation for User Story 3

- [x] T017 [US3] Add `"exercise_session_count"` to `BadgeCategory`; add
      `exerciseId?: string` to the `Badge` type in `badge.ts`.
- [x] T018 [US3] Add `countDistinctSessionsForExercise` (same module as
      T013, or a shared `challengeMetrics.ts` if that grouping is starting to
      make more sense than scattering one function per file).
- [x] T019 [US3] Extend `challengesService.ts`: the set-logs query from T014
      needs to also carry each set's resolved `exerciseId` (join through
      `workout_exercises`, matching how `sessionService.ts`'s
      `hydrateSessionDetails` already resolves `exerciseId` from
      `workoutExerciseId` — reuse that join shape rather than inventing a
      new one); for any badge row with a non-null `exercise_id`, dispatch to
      `countDistinctSessionsForExercise` instead of the account-wide
      aggregates.
- [x] T020 [US3] Manually validate in Expo: log Barbell Bench Press in
      several distinct sessions (including one with 2+ bench sets) and
      confirm progress reflects session count, not set count.

**Checkpoint**: User Stories 1-3 are all independently functional.

---

## Phase 5: Foundational for US4/US5 - Personal records schema

**Purpose**: `personal_records` table + the deferred `pr_count`/
`bodyweight_ratio` badge rows + the new `barbell-deadlift` exercise, all
needed before US4/US5 can be implemented.

**CRITICAL**: US4 and US5 cannot start until this phase is complete.

- [x] T021 Author `supabase/migrations/0008_personal_records.sql`: create
      `public.personal_records (id uuid primary key default gen_random_uuid(),
      user_id uuid not null references profiles(id) on delete cascade,
      exercise_id text not null references exercises(id), weight numeric not
      null check (weight > 0), reps integer not null check (reps > 0),
      session_id uuid not null references workout_sessions(id) on delete
      cascade, achieved_at timestamptz not null default now())`; enable RLS
      with an `all`-action `user_id = auth.uid()` policy (same pattern as
      `sample_workout_favourites`); add an index on `(user_id, exercise_id)`.
- [x] T022 In the same migration, widen `badges.category`'s check constraint
      further to add `pr_count` and `bodyweight_ratio`.
- [x] T023 Research and add a `barbell-deadlift` exercise: find a real
      wger-hosted photo for a conventional barbell deadlift using the same
      wger-translation-search approach used for migration `0006` (search
      `exercise-translation` for deadlift-related names, cross-reference
      `exerciseinfo` for one with a real image, excluding the
      Romanian/sumo/kettlebell/single-leg variants already in the library
      per spec.md's Assumptions); insert the row in the same migration with
      correct `muscle_group_id` (`legs` or `back`, matching how
      `barbell-squat`/`romanian-deadlift` are categorized today) and
      `equipment` ('Barbell').
- [x] T024 In the same migration, seed the US4/US5 badge rows: `('first-pr',
      'pr_count', 1, 'First PR')`; `('pr-50', 'pr_count', 50, '50 PRs')`;
      `('bench-bodyweight', 'bodyweight_ratio', 1, 'Bench bodyweight',
      exercise_id = 'barbell-bench-press', ratio_multiplier = 1.0)`;
      `('squat-1.5x-bodyweight', 'bodyweight_ratio', 1, 'Squat 1.5x
      bodyweight', exercise_id = 'barbell-squat', ratio_multiplier = 1.5)`;
      `('deadlift-2x-bodyweight', 'bodyweight_ratio', 1, 'Deadlift 2x
      bodyweight', exercise_id = 'barbell-deadlift', ratio_multiplier = 2.0)`
      — note the `threshold` column is unused/always `1` for this category
      since achievement is a boolean ratio comparison, not a count; document
      that in a migration comment so it doesn't read as a mistake later.
- [x] T025 Mirror all of the above (schema, the new exercise, and the new
      badge rows) in `supabase/seed.sql` for fresh resets.
- [x] T026 Apply the migration to the linked Supabase project and verify the
      new table, exercise, and badge rows via read queries.

**Checkpoint**: US4 and US5 are both unblocked.

---

## Phase 6: User Story 4 - Personal record tracking and PR-count badges (Priority: P3)

**Goal**: Completing a session that includes a new heaviest-ever set for an
exercise persists a `personal_records` row; "First PR" and "50 PRs" reflect
the running count.

**Independent Test**: Complete a session with a new heaviest-ever squat set
and verify (via a direct query, since no PR-history UI is in scope) that a
`personal_records` row was inserted; complete a session with a lighter set
afterward and confirm no new row appears; discard a session containing what
would have been a new PR and confirm nothing is persisted.

### Tests for User Story 4

- [x] T027 [P] [US4] Unit test for a new pure `detectNewPersonalRecords(
      sessionSetLogs: {exerciseId: string; weight: number | null; reps:
      number}[], priorBestByExercise: Map<string, number>): {exerciseId:
      string; weight: number; reps: number}[]`: per plan.md Design Decision
      2, returns at most one entry per exercise (that exercise's max weight
      *within this session*), only when it strictly exceeds the prior best
      (or the exercise has no prior best at all); bodyweight sets (`weight:
      null`) never produce a PR.
- [x] T028 [P] [US4] Integration test (extending the existing
      fake-Supabase-client pattern already used for `sessionService`) for
      `completeSession()`: completing a session with a new best inserts
      exactly one `personal_records` row for that exercise; completing a
      session with no new bests inserts none; a session that reaches
      `discardSession()` instead of `completeSession()` never triggers PR
      detection at all.

### Implementation for User Story 4

- [x] T029 [P] [US4] Add `src/models/personalRecord.ts`: the `PersonalRecord`
      type (id, userId, exerciseId, weight, reps, sessionId, achievedAt).
- [x] T030 [P] [US4] Add `"pr_count"` to `BadgeCategory` in `badge.ts`.
- [x] T031 [US4] Add `detectNewPersonalRecords` (e.g.
      `src/features/sessions/personalRecordDetection.ts`) per T027.
- [x] T032 [US4] Add repository methods to `sessionRepository.ts` (or a new
      `personalRecordRepository.ts` alongside it, matching the existing
      one-repository-per-table convention): `getBestWeightsByExercise(userId,
      exerciseIds): Map<string, number>` (reads `MAX(weight) group by
      exercise_id` from `personal_records`) and `insertPersonalRecords(rows)`.
- [x] T033 [US4] Wire PR detection into `sessionService.ts`'s
      `completeSession()` (plan.md Design Decision 1): after the session's
      status update succeeds, group its set logs by resolved `exerciseId`,
      call `detectNewPersonalRecords` against
      `getBestWeightsByExercise`, and `insertPersonalRecords` for the result
      (no-op if empty).
- [x] T034 [US4] Extend `challengesService.ts`'s `getProgress()` to fetch the
      user's `personal_records` rows and extend `toBadgeProgress` to handle
      `pr_count` (row count vs. threshold).
- [x] T035 [US4] Manually validate in Expo: complete a session with a new
      heaviest squat set, confirm "First PR" achieves; repeat with
      progressively heavier sets across enough distinct exercise/session
      pairs to also confirm "50 PRs"; confirm discarding a session with what
      would have been a new best does not create a PR or move the count.

**Checkpoint**: User Story 4 is independently functional (User Story 5 is
not required for PR tracking/counting to work).

---

## Phase 7: User Story 5 - Bodyweight-ratio strength badges (Priority: P3)

**Goal**: "Bench bodyweight," "Squat 1.5x bodyweight," and "Deadlift 2x
bodyweight" compare each user's current profile bodyweight against their
best-ever recorded set (from `personal_records`) for the relevant exercise.

**Independent Test**: With a test account's bodyweight set to 70kg, record a
70kg Barbell Bench Press PR (via a completed session) and confirm "Bench
bodyweight" achieves; confirm it does not achieve at 69kg, and that all three
ratio badges show not-achieved (not an error) when no bodyweight is on file.

### Tests for User Story 5

- [x] T036 [P] [US5] Unit test for a new pure `isRatioBadgeAchieved(
      bodyweight: number | null, bestWeightForExercise: number | undefined,
      multiplier: number): boolean`: `false` (not an error) when bodyweight is
      null or there's no PR yet for the exercise; `true` only when
      `bestWeightForExercise >= bodyweight * multiplier`.

### Implementation for User Story 5

- [x] T037 [US5] Add `"bodyweight_ratio"` to `BadgeCategory`; add
      `ratioMultiplier?: number` to the `Badge` type in `badge.ts`.
- [x] T038 [US5] Add `isRatioBadgeAchieved` (same module as T031, or
      alongside it).
- [x] T039 [US5] Extend `challengesService.ts`'s `getProgress()` to fetch the
      current user's `profiles.bodyweight` (via the existing
      `profileService`/`profileRepository`, whichever already exposes it) in
      the same `Promise.all`, derive a per-exercise best-weight map from the
      `personal_records` rows already fetched in T034, and extend
      `toBadgeProgress` to handle `bodyweight_ratio` using
      `isRatioBadgeAchieved`.
- [x] T040 [US5] Update the Challenges tab screen (wherever the badge list is
      rendered) to show a short explanatory line for not-yet-achieved
      `bodyweight_ratio` badges when the cause is a missing bodyweight (e.g.
      "Add your bodyweight in your profile to unlock this badge"), per
      spec.md Acceptance Scenario 1 for US5 — this is the one UI copy change
      in the whole spec.
- [x] T041 [US5] Manually validate in Expo: with bodyweight unset, confirm
      all three ratio badges show not-achieved with the explanatory copy, not
      an error; set bodyweight to 70kg, record a 70kg bench PR, confirm
      "Bench bodyweight" achieves; raise bodyweight afterward and confirm the
      badge can become un-achieved again (plan.md Design Decision 6 —
      expected, not a bug).

**Checkpoint**: All five user stories are independently functional together.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Whole-feature verification once every story above is complete.

- [x] T042 [P] Run `tsc --noEmit`, `eslint .`, and the full `jest` suite;
      fix anything the new categories/tests surfaced.
- [x] T043 Full manual regression pass on the Challenges tab: every existing
      badge (lifetime_workouts, streak) still renders and sorts correctly
      alongside all five new categories, achieved-first-then-ascending
      exactly as `sortBadges` already does today — confirm no new category
      needed a change to that sort function.
- [x] T044 Update `specs/010-gamification-achievements/spec.md`'s Status to
      `Delivered` (with a "Delivered scope" note, per the spec 006/009
      precedent) once the above is confirmed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — BLOCKS US1, US2, US3.
- **User Story 1 (Phase 2)**: Depends on Phase 1 only.
- **User Story 2 (Phase 3)**: Depends on Phase 1 only — independent of US1.
- **User Story 3 (Phase 4)**: Depends on Phase 1 only — independent of US1/US2.
- **Foundational for US4/US5 (Phase 5)**: No dependency on Phases 2-4 — can
  run in parallel with US1-US3, but BLOCKS US4 and US5.
- **User Story 4 (Phase 6)**: Depends on Phase 5 only.
- **User Story 5 (Phase 7)**: Depends on Phase 5 **and** Phase 6 (reads
  `personal_records`, populated by US4's `completeSession()` wiring and
  fetched via US4's T034 query) — the one cross-story dependency in this
  spec, called out explicitly in spec.md and plan.md.
- **Polish (Phase 8)**: Depends on all five user stories being complete.

### Parallel Opportunities

- Phase 1 and Phase 5 touch different tables/files and can be done together
  before any user story starts, if desired — Phase 5 just can't be skipped
  before starting US4/US5.
- US1, US2, and US3 (Phases 2-4) can be built in any order or in parallel
  once Phase 1 is done — different files, no shared dependency beyond the
  common `challengesService.ts` (each story's task there touches a distinct
  `case` in the same dispatch function, low collision risk but not zero;
  coordinate if working in parallel).
- Within each story, unit tests marked [P] can run in parallel with each
  other before implementation begins.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: User Story 1.
3. STOP and validate in Expo; this alone ships "First workout," the 365-day
   streak tier, and the monthly badge with no other new infrastructure.

### Incremental Delivery

1. Phase 1 -> Phase 2 (US1) -> validate -> ship.
2. Phase 3 (US2) -> validate -> ship.
3. Phase 4 (US3) -> validate -> ship.
4. Phase 5 (Foundational) -> Phase 6 (US4) -> validate -> ship.
5. Phase 7 (US5) -> validate -> ship.
6. Phase 8: Polish once all five are live.
