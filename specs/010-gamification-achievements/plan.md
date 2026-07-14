# Implementation Plan: Gamification - Achievement Badges

**Branch**: `010-gamification-achievements` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-gamification-achievements/spec.md`

## Summary

Extends the existing badges/challenges system (spec 007) from two fixed
categories (`lifetime_workouts`, `streak`) to seven, adding: a new "First
workout" / "365-day streak" threshold on the two existing categories (US1), a
new best-calendar-month workout count category (US1), a lifetime-total-kg-lifted
category (US2), an exercise-scoped session-count category (US3), and — the one
piece of genuinely new infrastructure — a persisted `personal_records` table
plus PR-count and bodyweight-ratio categories (US4/US5) that read the current
`profiles.bodyweight` field (already collected) against a user's best-ever
logged weight per exercise. US5 also requires adding a `barbell-deadlift`
exercise to the curated library, which doesn't exist today. No new screens —
every badge surfaces on the existing Challenges tab.

## Technical Context

**Language/Version**: TypeScript (unchanged)

**Primary Dependencies**: Expo, React Native, `@supabase/supabase-js`,
expo-router — all unchanged. No new package.

**Storage**: Supabase Postgres, RLS-scoped. Two migrations:
`0007_badge_categories.sql` (widens `badges.category`'s check constraint,
adds nullable `exercise_id`/`ratio_multiplier` columns, seeds the new US1-3
badge rows) and `0008_personal_records.sql` (new `personal_records` table +
RLS policy, seeds the US4-5 badge rows, inserts the new `barbell-deadlift`
exercise). Matches the existing pattern of `0006_curated_exercise_wger_images.sql`
being a data/seed-only migration alongside schema ones.

**Testing**: Jest unit tests for the new pure logic (volume summation,
best-month grouping, PR max-comparison, ratio-badge achievement) against the
existing fake-Supabase-client test pattern already used for
`challengesService`/`sessionRepository`; manual Expo validation of the
Challenges tab per story, consistent with specs 001-009.

**Target Platform**: Expo Go (iOS/Android/web), unmodified.

**Project Type**: mobile-app

**Performance Goals**: Unchanged. `getProgress()` gains a few more queries
(profile bodyweight, personal_records, set_logs-with-exercise-join) but stays
one screen-load, personal-scale (two accounts) — no pagination or caching
needed.

**Constraints**: Per-user isolation via RLS on the new `personal_records`
table; Expo Go compatibility (no new native module); Challenges tab UI is
reused unmodified, not redesigned.

**Scale/Scope**: Personal-scale multi-user, same as specs 006-009.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after design below.*
*Checked against constitution v2.0.0.*

- Beginner-first: Every new badge reuses the existing locked/unlocked,
  no-action-required presentation — nothing new for a beginner to learn or
  configure.
- Cloud-backed, per-user data: `personal_records` is a new table scoped by
  `user_id = auth.uid()` RLS, same isolation model as every other table;
  no offline behavior introduced beyond the existing "can't reach the server"
  state (set-logging already surfaces this; PR detection rides the same write).
- Approved stack: No new dependency; both migrations are plain Postgres DDL/seed
  SQL through the existing Supabase project.
- Simplicity: **Spec 007 already flagged gamification as Principle-IV scope
  needing justification, and deliberately kept the badges schema to exactly two
  fixed, non-extensible categories, explicitly rejecting "an
  extensible/configurable badge system... as speculative — nothing today needs
  a third category."** This spec reverses that call: the user has since asked
  for five more categories that the narrow schema cannot express. That's
  accepted as legitimate scope growth (explicitly requested, not speculative),
  but it is a real complexity increase over spec 007's design, tracked below.
- Testable increment: Each user story has its own Independent Test in spec.md;
  US1 ships independently of everything else (reuses existing categories +
  one new simple one), US2/US3 are independent of each other, US4 (PR
  infrastructure) must ship before US5 (which depends on it).

## Project Structure

### Documentation (this feature)

```text
specs/010-gamification-achievements/
|-- spec.md                # Feature spec
`-- plan.md                # This file
```

(No `research.md`/`data-model.md`/`contracts/` split — same call as specs
007/009: the Design Decisions section below covers the real design work,
nothing here needs a separate research pass.)

### Source Code (repository root)

```text
supabase/
`-- migrations/
    |-- 0007_badge_categories.sql     # widen badges.category check; add exercise_id/ratio_multiplier; seed US1-3 rows
    `-- 0008_personal_records.sql     # new personal_records table + RLS; seed US4-5 badge rows; insert barbell-deadlift exercise

supabase/seed.sql                    # mirror both migrations' catalog/exercise additions for fresh resets

src/
|-- features/
|   |-- challenges/
|   |   |-- badge.ts                  # BadgeCategory gains 5 members; Badge gains exerciseId/ratioMultiplier
|   |   `-- challengesService.ts      # getProgress() fetches + computes the 5 new value sources
|   |-- sessions/
|   |   `-- sessionService.ts         # completeSession() gains a personal-record detection step
|   `-- profile/
|       `-- profileService.ts         # expose current bodyweight to challengesService (likely already does)
`-- models/
    `-- personalRecord.ts             # new: PersonalRecord type

tests/
`-- unit/
    |-- challengesService.test.ts     # extend with volume/monthly/exercise-session/PR-count/ratio cases
    `-- personalRecordDetection.test.ts  # new: pure "is this a new best" comparison logic
```

**Structure Decision**: Keep the existing `features/challenges` and
`features/sessions` seams — no new feature folder. PR detection is added to
`sessionService.completeSession()` rather than `setLogService.logSet()` (see
Design Decision 1). `challengesService.getProgress()` remains the single read
path the Challenges tab already calls; it grows richer inputs, not a new
public API shape (still returns `ChallengeProgress` with a `badges: BadgeProgress[]` list).

## Design Decisions

1. **PR detection runs once per session at `completeSession()`, not per-set
   at `logSet()`.** A set logged mid-session could be a "PR" only for the user
   to discard that session later — `setLogService.logSet()` has no way to
   retract a persisted PR row after the fact without extra invalidation logic.
   `sessionService.completeSession()` (`sessionService.ts:140-165`, called
   from both the ordinary Finish flow and early-end-then-finish per spec 005)
   is the one place a session's sets are known-final. After marking the
   session `completed`, group that session's `set_logs` by
   `workoutExerciseId` -> `exerciseId`, take the max weight logged per exercise
   *within this session*, and compare each against that exercise's current
   best from `personal_records` (or "no prior record" for a first-ever PR).
   Insert one `personal_records` row per exercise that produced a new best.
   This also directly satisfies spec.md's edge case ("a discarded session's
   PRs are never counted") for free — a discarded session never reaches this
   step.
2. **One PR event per exercise per session, not per set.** If a user logs 60kg
   then 65kg on Barbell Squat in the same session, that's one new PR (65kg),
   not two — matches the natural reading of "personal record" as "your best,"
   not "every set that beat your previous best at the time you logged it."
   Keeps `personal_records` small (bounded by sessions x exercises, not by
   total sets) and keeps the "50 PRs" badge meaningful (50 genuinely-improved
   exercise/session pairs, not 50 incrementally-better sets in one session).
3. **`personal_records` stores every PR *event*, not just the current best per
   exercise.** A row is never updated or deleted when superseded — the
   "current best" for an exercise is `MAX(weight)` over that user's rows for
   it. This keeps PR-count (`total row count`) and current-best (`MAX`)
   both trivial queries with no update-in-place logic, and leaves room for a
   future PR-history view without a schema change.
4. **"10 workouts in a month" tracks the best calendar month ever, not "this
   month."** Spec 007's existing categories are both explicitly
   monotonically non-decreasing ("both are monotonically non-decreasing, so
   there is nothing to backfill or un-achieve" — `0004_polish_and_challenges.sql`
   comment) — the existing `streak` category already uses *longest-ever*
   streak, not current streak, for exactly this reason. The new
   `monthly_workout_count` category follows the same rule: value = the
   highest number of completed sessions found in any single calendar month
   across the account's whole history. Once achieved, always achieved — no
   surprise "you lost your badge because this month was quiet" behavior.
5. **`total_volume_kg` and `exercise_session_count` are also monotonically
   non-decreasing** (lifetime sums/counts only grow), so they fit the existing
   "nothing to un-achieve" model cleanly with no special-casing.
6. **`bodyweight_ratio` is the one new category that is *not* monotonically
   non-decreasing, and this is called out explicitly** (spec.md Assumptions,
   US5 acceptance scenario 4): achievement is recomputed against whatever
   `profiles.bodyweight` holds right now, so raising recorded bodyweight can
   un-achieve an already-achieved ratio badge. This is accepted as the
   simplest option consistent with the user's choice not to add bodyweight
   history tracking in this spec — flagged here so it's not mistaken for a bug
   later, since it's the one exception to specs 007/010's otherwise-uniform
   "badges never regress" behavior.
7. **`badges` schema change keeps the existing `category`+`threshold`
   uniqueness for the two original categories, using partial unique indexes
   instead of widening the old table-level constraint.** Naively changing
   `unique (category, threshold)` to `unique (category, threshold,
   exercise_id)` would silently weaken uniqueness for every existing row,
   since Postgres treats `NULL <> NULL` in unique constraints — two
   `lifetime_workouts`/threshold-10/`exercise_id NULL` rows would no longer
   conflict. Instead: `create unique index badges_no_exercise_uq on badges
   (category, threshold) where exercise_id is null;` (covers the three
   account-wide categories, unchanged behavior) and `create unique index
   badges_with_exercise_uq on badges (category, threshold, exercise_id) where
   exercise_id is not null;` (covers the two exercise-scoped categories).
8. **Bench/Squat map to the existing `barbell-bench-press`/`barbell-squat`
   exercises; Deadlift requires adding `barbell-deadlift` to the library
   first**, per the user's explicit choice over repointing at the existing
   Romanian Deadlift entry. Follows the same curated-exercise pattern as the
   other 23 (real wger-hosted photo via the same search approach used for
   migration `0006`, correct `muscle_group_id`/`equipment`) — this is
   implementation research to do during US5's tasks, not a decision left open
   in this plan.
9. **`challengesService.getProgress()` grows its data-fetching, not its public
   shape.** It already fetches badge catalog rows + completed-session end
   times in parallel (`challengesService.ts:52-58`); this adds, in the same
   `Promise.all`: the user's profile bodyweight, all completed sessions' set
   logs joined to their exercise id (for volume/monthly/per-exercise
   aggregation), and the user's `personal_records` rows. `toBadgeProgress`
   becomes a per-category dispatch instead of the current two-branch ternary,
   but `ChallengeProgress`'s returned fields are additive only (existing
   `lifetimeWorkoutCount`/`longestStreakDays`/`badges` keys unchanged) so the
   Challenges tab component needs no changes beyond rendering more badge rows
   it already knows how to render.

## Complexity Tracking

*Required — spec 007 precedent for gamification justification, extended here
since this spec is the reversal of a scope decision spec 007 made explicitly.*

| Change | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Badge catalog grows from 2 fixed categories to 7, with per-badge exercise scoping and a ratio multiplier | Explicitly requested by the user (12 named badges spanning volume, PR count, exercise-specific counts, and bodyweight ratios) — none of the 12 fit the two existing categories | Keeping only the 2 original categories and declining the other 10 badges was considered, but directly contradicts the user's explicit, prioritized ask |
| New `personal_records` table (persisted history, not a live query) | "Heaviest set ever, at the time it was logged" needs a durable record — a live `MAX(weight)` query over all historical `set_logs` would give the same *current* answer but can't distinguish "was this a new record when logged" from "is this just the biggest number in the table," and would recompute over the account's entire set-log history on every Challenges-tab load as data grows | A live-only computation (no new table) was rejected: it can't produce a stable PR *count* (every load would just re-derive "the current max," never "how many times was a new max set") |
| `bodyweight_ratio` category breaks the existing "badges never regress" invariant | User explicitly chose simple current-value bodyweight over building bodyweight-history tracking, which is what would be needed to keep ratio badges monotonic (compare against bodyweight *at time of PR*, not bodyweight *now*) | Bodyweight history tracking was offered as an option and explicitly declined by the user as more than this pass needs |
