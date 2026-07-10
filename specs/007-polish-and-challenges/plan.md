# Implementation Plan: Session Polish, Account Menu, Favourites, and Challenges

**Branch**: `007-polish-and-challenges` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-polish-and-challenges/spec.md`

## Summary

Six independent, additive fixes/features on top of the spec-006 Supabase
backend: let a session end (and get rated) before every set is logged; fix
History's sort order; make per-exercise rest time actually editable and
actually used; add a global account menu; extend the existing favourite
system to sample workouts on a per-account basis; and add a new Challenges
tab computing lifetime-workout and streak badges from existing history. No
new backend concept is introduced — everything builds on the RLS-scoped
Postgres schema and `features/*Service.ts` seam already established.

## Technical Context

**Language/Version**: TypeScript (unchanged)

**Primary Dependencies**: Expo, React Native, `@supabase/supabase-js`,
expo-router — all unchanged from spec 006. No new dependency is required.

**Storage**: Supabase Postgres, RLS-scoped. One new reference table
(`badges`, public-read like `exercises`) and one new user-scoped join table
(`sample_workout_favourites`); every other change reuses existing columns
(`workout_exercises.target_rest_seconds` already exists and is already
NOT NULL) or existing tables.

**Testing**: Jest unit tests for the new pure logic (longest-streak
calculation, badge-threshold evaluation, rest-time validation) using the
existing fake-Supabase test double for service-level tests; React Native
Testing Library for the new/changed screens; manual Expo validation per
story, consistent with specs 001-006.

**Target Platform**: Expo Go (iOS/Android/web), unmodified — unchanged
constraint.

**Project Type**: mobile-app (unchanged)

**Performance Goals**: Unchanged from spec 006 — no story here introduces a
new heavy query; the widest read (challenge badge computation) is bounded by
one account's own completed-session history.

**Constraints**: Per-user isolation via RLS for every new/changed table;
Expo Go compatibility; no new native module.

**Scale/Scope**: Personal-scale multi-user, same as spec 006. Badge
computation reads one account's own history — no cross-account aggregation.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after design below.*
*Checked against constitution v2.0.0.*

- Beginner-first: Unaffected for US1-US5 (fixes/extends existing plain-language
  flows). US6 (Challenges) uses plain thresholds ("10 workouts", "3 day
  streak") rather than expert training jargon.
- Cloud-backed, per-user data: Satisfied — the two new/changed tables
  (`sample_workout_favourites`, badge computation reading only the caller's
  own rows) get the same `auth.uid() = user_id` RLS pattern as every existing
  user-owned table; no offline behavior is introduced beyond the existing
  "can't reach the server" state.
- Approved stack: Satisfied — no new dependency, no new native module, Expo
  Go compatibility unaffected.
- Simplicity: US6 is gamification, which Principle IV flags for justification
  — scoped narrowly to exactly the two badge categories the user asked for
  (lifetime count, streak), computed from data that already exists, with no
  new settings/social/analytics surface. See Complexity Tracking below.
- Testable increment: Each of the six user stories has its own Independent
  Test in spec.md and maps to its own phase in tasks.md; US1-US5 need no
  schema change and can ship/test independently of US6.

## Project Structure

### Documentation (this feature)

```text
specs/007-polish-and-challenges/
|-- spec.md               # Feature spec
`-- plan.md                # This file
```

(No separate `research.md`/`data-model.md`/`contracts/` — same call as spec
006: the design decisions below cover this feature's ground at an
appropriate size; nothing here is ambiguous enough to warrant a split.)

### Source Code (repository root)

```text
supabase/
|-- migrations/
|   `-- 0004_polish_and_challenges.sql   # sample_workout_favourites + badges tables, RLS
`-- seed.sql                              # gains badge catalog rows

src/
|-- features/
|   |-- sessions/
|   |   `-- session.tsx-adjacent logic (end-early flow lives in app/, no new service method needed)
|   |-- workouts/
|   |   |-- workoutRepository.ts          # toggleFavourite/isFavourite branch on isTemplate
|   |   |-- workoutValidation.ts          # rest-time validation
|   |   `-- WorkoutExerciseEditor.tsx     # new rest-time input
|   |-- progress/
|   |   |-- streak.ts                     # new computeLongestStreakDays()
|   |   `-- streakService.ts              # unchanged; challengesService is a new sibling
|   |-- challenges/                        # new
|   |   |-- badge.ts                      # Badge type + static threshold catalog mirror
|   |   `-- challengesService.ts          # lifetime count + longest streak vs. badge catalog
|   `-- account/                           # new
|       `-- AccountMenu.tsx               # header-right dropdown: email, Profile, Sign out
`-- state/
    `-- activeSessionStore.ts             # setRestDurationSeconds actually called now

app/
|-- _layout.tsx                            # headerRight: <AccountMenu /> on every protected screen
|-- index.tsx                              # bottom nav gains "Challenges"; old header profile button removed (superseded by AccountMenu)
|-- challenges/
|   `-- index.tsx                          # new screen
|-- workouts/
|   |-- index.tsx                          # sample-workouts section gains onToggleFavourite
|   `-- new.tsx                            # rest-time field wired through
`-- workouts/[workoutId]/session.tsx        # "End workout" early action + per-exercise rest duration

tests/
|-- unit/
|   |-- streak.test.ts                     # + computeLongestStreakDays cases
|   |-- challengesService.test.ts          # new
|   `-- workoutValidation.test.ts          # + rest-time cases
`-- integration/ (unchanged shape)
```

**Structure Decision**: Keep the existing `features/*Service.ts` seam. Two
new feature folders (`challenges/`, `account/`) follow the same shape as
existing ones (`progress/`, `sessions/`). No new navigation pattern —
`app/challenges/index.tsx` slots into the existing flat `app/` route list and
the existing single dashboard-hosted bottom-nav row, matching how
Workouts/History are already reached today (there is no persistent
cross-screen tab bar currently, and introducing one is a larger change than
was asked for). The account menu is wired once via `Stack`'s
`screenOptions.headerRight` in `app/_layout.tsx` — since every signed-in
screen is already inside the same `Stack.Protected` group, this one change
satisfies "every top-level authenticated screen" without touching each
screen file individually.

## Design Decisions

1. **End early reuses the existing completion UI, it doesn't duplicate it.**
   `app/workouts/[workoutId]/session.tsx` already renders a full
   rating/summary view whenever `isWorkoutComplete` is true, driven by a
   `workoutCompletedAt` timestamp captured the instant it flips true. A new
   "End workout" action (visible only while sets remain) asks for
   confirmation, then sets `isWorkoutComplete` true itself instead of only
   the "every set logged" check doing so — the existing effect, rating
   picker, and Finish/Discard actions all work unchanged.
   `sessionService.completeSession()` already accepts `{ rating, endedAt }`
   with no full-completion requirement, so no service-layer change is
   needed.
2. **History sort is a one-line fix plus a tiebreaker.**
   `sessionRepository.listCompletedSessionsInRange` (used by the History
   screen) calls `.order("ended_at")` with no direction — Postgres/PostgREST
   default to ascending. Add `{ ascending: false }`, matching
   `listCompletedSessions`'s already-correct call, plus a secondary
   `.order("id", { ascending: false })` so equal-timestamp sessions have a
   stable order across loads.
3. **Rest time needed two fixes, not one.** The workout builder never
   rendered an input for `targetRestSeconds` (silently hardcoded to `"60"`
   in `editorValueForExercise`), and even where it's set, the active
   session's rest timer never reads it — `activeSessionStore`'s
   `setRestDurationSeconds` exists but is never called from `app/`. Fix:
   add a "Rest (sec)" `TargetInput` to `WorkoutExerciseEditor` (reusing the
   existing reps/weight input pattern and its inline-error style), validate
   it in `workoutValidation.ts`, and call `setRestDurationSeconds` with the
   current exercise's `targetRestSeconds` whenever the active exercise
   changes in `session.tsx`. No schema change —
   `workout_exercises.target_rest_seconds` is already `not null check (>= 0)`.
4. **Account menu is one `headerRight`, not four screen edits.** Every
   signed-in screen already renders inside the same `Stack.Protected`
   group in `app/_layout.tsx`; setting `screenOptions.headerRight` once
   adds the menu everywhere at once. The dashboard's existing ad hoc
   top-left "TrainingBuddy" + profile-initial button
   (`app/index.tsx`'s `topHeader`) is superseded and removed rather than
   left as a second, redundant entry point.
5. **Sample-workout favourites need a join table, not the existing column.**
   `workouts.is_favourite` lives on the row itself; template rows have
   `user_id is null` and are shared by every account, so that column can't
   represent "favourited by account X" without leaking to every other
   account — and RLS's `workouts_update_own` policy (`user_id = auth.uid()`)
   already silently blocks any attempt to write it for a template today.
   New table `sample_workout_favourites (user_id, workout_id)`, RLS-scoped
   to `user_id = auth.uid()`, same shape as every other user-owned table.
   `workoutRepository` computes `isFavourite` for template rows from
   membership in this table instead of the shared column, and
   `toggleFavourite` branches on `isTemplate` to insert/delete here instead
   of updating `workouts.is_favourite`. Once the repository is fixed, the
   existing `workoutRecommendationService` and `WorkoutsScreen`'s
   `onToggleFavourite` prop work for templates with no further change beyond
   passing that prop into the "Sample workouts" section, which today simply
   omits it.
6. **Badge achievement is computed live, not stored.** Lifetime workout
   count only grows, and "longest streak ever" is defined (FR-014) as a
   monotonically non-decreasing value too — so unlike a naive "current
   streak," it never needs to un-achieve a badge. That means badge state
   needs no mutable per-user storage at all: `badges` is a static, seeded
   reference table (same pattern as `exercises`), and
   `challengesService.getProgress()` computes lifetime count + longest
   streak from the account's own `workout_sessions` history each time the
   tab is opened, comparing against the catalog. This directly satisfies
   FR-013 (backfills existing history for free — there's nothing to
   backfill) and sidesteps a whole class of write-race/backfill-migration
   bugs a `badge_awards` table would introduce.
7. **Longest-streak-ever is a new pure function, not a new query shape.**
   `computeStreakDays` in `streak.ts` only ever measures the run ending at
   "today" (right for the dashboard). A sibling `computeLongestStreakDays`
   reuses the same local-date-key helpers to find the longest run anywhere
   in the date set. `challengesService` feeds it the account's full
   completed-session date list — `streakService`'s existing 60-day
   `LOOKBACK_DAYS` window is dashboard-appropriate but too short for
   "ever," so the challenges query is unbounded (still just one account's
   own rows).

## Complexity Tracking

*Documented per constitution Governance — Principle IV requires
justification for gamification.*

| Change | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Challenges tab (badges) is gamification | Explicitly requested by the user (US6) | A narrower "just show my lifetime count" stat was considered, but doesn't satisfy the explicit ask for discoverable, thresholded badges with locked/unlocked states |
| Scope is fixed to exactly two badge categories (lifetime count, streak) at fixed thresholds, computed live | Keeps the gamification surface from growing into a general achievements system | An extensible/configurable badge system was rejected as speculative — nothing today needs a third category |
