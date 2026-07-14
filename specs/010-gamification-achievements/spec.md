# Feature Specification: Gamification - Achievement Badges

**Feature Branch**: `010-gamification-achievements`

**Created**: 2026-07-13

**Status**: Delivered

**Delivered scope**: All five user stories shipped in full. US1 added
"First workout," "365-day streak," and "10 workouts in a month" (best-ever
calendar month, never un-achieves) on the existing badge track. US2 added
lifetime-volume badges (10,000kg / 1,000,000kg) computed from real set
history. US3 added the first exercise-scoped badge ("100 bench sessions,"
counted by distinct session, not set count). US4 introduced a new
`personal_records` table, populated once per completed session (never for a
discarded one) with "First PR"/"50 PRs" badges on top of it. US5 added the
three bodyweight-ratio badges, including sourcing a real conventional
Barbell Deadlift exercise from wger (the library had none) since the
existing Romanian/sumo/kettlebell variants weren't a fair fit for a "2x
bodyweight" target. Migrations `0007_badge_categories.sql` and
`0008_personal_records.sql` are applied to the live project. `tsc`,
`eslint`, and the full `jest` suite (287 tests) are green. The "Smart
Features" half of the original request (PR-detection toast, plateau
detection, volume/recovery recommendations, symmetry, weekly score) remains
out of scope here, deferred to its own future spec per the Assumptions
below — it can build directly on this spec's `personal_records` table and
volume-aggregation work.

**Input**: User description: "Gamification / Achievements: First workout, 100 workouts,
10,000kg lifted, 1 million kg lifetime, 100 bench sessions, 365-day streak, Bench
bodyweight, Deadlift 2x bodyweight, Squat 1.5x bodyweight, 10 workouts in a month,
First PR, 50 PRs. (A related 'Smart Features' batch - auto PR detection, plateau
detection, volume/recovery recommendations, symmetry tracking, weekly score - was
requested in the same message but deferred to a later spec per the user's own
prioritization: achievements first, smart features second.)"

**Scope note**: This spec covers only the achievement-badge list. The "Smart
Features" half of the original request (PR toast, plateau detection, volume/
recovery recommendations, symmetry, weekly score) is intentionally out of scope
here and should become its own spec once this one ships - see Assumptions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New milestone badges on the existing badge track (Priority: P1)

A user opens the Challenges tab and sees new badges alongside the existing
lifetime-workout-count and streak badges: "First workout" (their very first
completed session), a "365-day streak" tier, and "10 workouts in a month." These
reuse the same live-computed, no-new-screen mechanic the app already has - no
manual claiming, no separate achievements table, just more thresholds to reach.

**Why this priority**: Cheapest possible slice - "First workout" and "365-day
streak" are just new rows in the existing `badges` catalog on categories that
already exist (`lifetime_workouts`, `streak`); only "10 workouts in a month" needs
a new (but simple) category computed the same way streaks are today. Ships fast,
proves the extended catalog works, no schema redesign yet.

**Independent Test**: Complete a single workout session as a fresh test account
and confirm "First workout" flips to achieved immediately on the Challenges tab.
Separately, complete 10 sessions within one calendar month and confirm the new
monthly badge is achieved; complete sessions spread across different months and
confirm it is not.

**Acceptance Scenarios**:

1. **Given** a signed-in user with zero completed sessions, **When** they finish
   their first workout, **Then** "First workout" shows as achieved on the
   Challenges tab without any other action.
2. **Given** a user who has completed sessions on 10 different days within a
   single calendar month, **When** they view the Challenges tab, **Then** the
   "10 workouts in a month" badge shows as achieved.
3. **Given** a user with a 300-day current streak, **When** they reach day 365,
   **Then** the "365-day streak" badge shows as achieved, consistent with how
   existing streak badges (7, 14, 30 days) already behave.

---

### User Story 2 - Lifetime volume badges (Priority: P2)

A user sees two new badges tracking total weight lifted across every logged set,
ever: "10,000kg lifted" and "1,000,000kg lifetime." Bodyweight-only sets (reps
with no weight) don't contribute kg, consistent with how the app already treats
bodyweight exercises elsewhere.

**Why this priority**: Needs a new badge category (`total_volume_kg`) and a new
live-aggregation query over `set_logs`, but no new tables - still additive to the
existing badges schema. Slightly more work than User Story 1's reused categories.

**Independent Test**: Log a handful of weighted sets whose `reps * weight` sums
past 10,000kg for a test account and confirm the badge flips to achieved on the
Challenges tab; confirm it's unaffected by bodyweight-only sets.

**Acceptance Scenarios**:

1. **Given** a user whose logged sets sum to less than 10,000kg of total volume,
   **When** they view the Challenges tab, **Then** "10,000kg lifted" shows as not
   yet achieved, with no error.
2. **Given** a user whose logged sets sum to 10,000kg or more, **When** they view
   the Challenges tab, **Then** "10,000kg lifted" shows as achieved.
3. **Given** a user who has only ever logged bodyweight exercises, **When** they
   view the Challenges tab, **Then** the volume badges show 0kg progress, not an
   error or a badge based on reps alone.

---

### User Story 3 - Exercise-specific session count badge (Priority: P2)

A user sees a "100 bench sessions" badge: achieved once they've logged at least
one set of Barbell Bench Press in 100 distinct sessions.

**Why this priority**: Introduces the idea of a badge scoped to one specific
exercise rather than an account-wide total - a small schema addition (a nullable
exercise reference on the badge catalog) that Story 5's bodyweight-ratio badges
will also depend on, so it's sequenced before them.

**Independent Test**: Log Barbell Bench Press in several distinct sessions for a
test account and confirm the badge's progress count matches the number of
distinct sessions containing that exercise, not the number of sets.

**Acceptance Scenarios**:

1. **Given** a user who has logged Barbell Bench Press in 40 distinct sessions,
   **When** they view the Challenges tab, **Then** the badge shows 40 of 100, not
   yet achieved.
2. **Given** a user who logs Barbell Bench Press twice in the same session,
   **When** progress is computed, **Then** that session counts once toward the
   100, not twice.

---

### User Story 4 - Personal record (PR) tracking and PR-count badges (Priority: P3)

The app starts recognizing when a logged set is the heaviest weight the user has
ever lifted for that exercise, and counts these as "PRs." Two badges track this:
"First PR" and "50 PRs."

**Why this priority**: This is the biggest addition in this spec - it introduces
a new persisted concept (personal records) rather than a live aggregation, because
"was this the heaviest set at the time it was logged" needs a durable record, not
just a query over current data. It's sequenced last because it's shared groundwork
with the (separately-specced) "auto-detect PR" smart feature - building it now
means that later feature has a foundation to read from instead of starting over.

**Independent Test**: Log a set at a new heaviest weight for an exercise and
confirm it's recorded as a PR (verify via a query, since no dedicated PR-history
UI is required by this spec); log a lighter or equal set afterward and confirm it
is not. Repeat across 50 different exercises/weights for a test account and
confirm "50 PRs" achieves.

**Acceptance Scenarios**:

1. **Given** a user has never logged Barbell Squat before, **When** they log a
   Barbell Squat set at any weight, **Then** it is recorded as a PR for that
   exercise (the first logged set is always a PR).
2. **Given** a user's heaviest-ever Barbell Squat set is 60kg, **When** they log a
   65kg set, **Then** a new PR is recorded; **When** they later log a 55kg or 60kg
   set, **Then** no new PR is recorded.
3. **Given** a user has recorded PRs across enough distinct sets to reach 50,
   **When** they view the Challenges tab, **Then** "50 PRs" shows as achieved.
4. **Given** a user discards a session before finishing it, **When** progress is
   recomputed, **Then** any PRs logged only in that discarded session are not
   counted (consistent with how discarded sessions already don't count toward
   other badges).

---

### User Story 5 - Bodyweight-ratio strength badges (Priority: P3)

Three badges compare a user's best-ever lift on a specific exercise to their
current bodyweight: "Bench bodyweight" (heaviest Barbell Bench Press set ≥
bodyweight), "Squat 1.5x bodyweight" (heaviest Barbell Squat set ≥ 1.5 × bodyweight),
and "Deadlift 2x bodyweight" (heaviest Barbell Deadlift set ≥ 2 × bodyweight - this
exercise doesn't exist in the library yet and must be added first, see Assumptions).

**Why this priority**: Depends on both User Story 3's exercise-scoped badge
concept and User Story 4's PR data (the "heaviest set ever" for the relevant
exercise), so it's sequenced after both. It also depends on the user having
entered their bodyweight in their profile - if they haven't, these three badges
are simply never achievable, which is expected, not an error state.

**Independent Test**: With a test account's profile bodyweight set to 70kg, log a
Barbell Bench Press set at 70kg or more and confirm "Bench bodyweight" achieves;
confirm it does not achieve at 69kg.

**Acceptance Scenarios**:

1. **Given** a user has not entered a bodyweight in their profile, **When** they
   view the Challenges tab, **Then** the three ratio badges show as not achieved
   (never an error), and the Challenges tab should make clear why (e.g. "Add your
   bodyweight in your profile to unlock this badge").
2. **Given** a user's bodyweight is 70kg and their heaviest-ever Barbell Bench
   Press set is 70kg, **When** they view the Challenges tab, **Then** "Bench
   bodyweight" shows as achieved.
3. **Given** a user's bodyweight is 70kg and their heaviest-ever Barbell Squat set
   is 100kg (under the 105kg needed for 1.5x), **When** they view the Challenges
   tab, **Then** "Squat 1.5x bodyweight" shows as not yet achieved.
4. **Given** a user later updates their profile bodyweight to a higher value,
   **When** the Challenges tab is viewed again, **Then** ratio badges are
   recomputed against the new bodyweight (an already-achieved ratio badge can
   become un-achieved again if bodyweight goes up enough) - this is expected
   behavior given bodyweight is a single current value, not a history (see
   Assumptions).

### Edge Cases

- What happens when a user has zero completed sessions? All badges (existing and
  new) show as not-yet-achieved with 0 progress; no divide-by-zero or crash.
- What happens to volume/PR/session-count badge progress when a session is
  discarded rather than finished? Discarded sessions must not contribute to any
  badge, matching existing behavior for lifetime-workout-count and streak badges.
- What happens if two sets in the same session both happen to be new PRs for two
  different exercises? Both are recorded independently; PR-count badges count
  distinct PR events, not sessions.
- What happens if a user logs the exact same weight as their current best (not
  higher)? Not a new PR - "heaviest ever" is a strict greater-than comparison.
- What happens when the device is offline while logging a set that would be a PR
  or unlock a badge? Consistent with existing session logging, the write fails
  visibly (existing error-state handling) rather than silently dropping the PR.
- What happens when a user tries to view another user's badge/PR progress?
  Prevented by Supabase RLS scoping to the authenticated account, same as all
  other tables today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The badges catalog MUST support new categories beyond the existing
  `lifetime_workouts` and `streak` (at minimum: total volume lifted, monthly
  workout count, exercise-specific session count, PR count, and bodyweight-ratio),
  without breaking the existing two categories' current behavior.
- **FR-002**: Some badges MUST be scoped to a specific exercise (e.g. "100 bench
  sessions", the three ratio badges); the catalog schema MUST support an optional
  exercise reference per badge row.
- **FR-003**: The system MUST compute a user's total lifetime volume (sum of
  `reps * weight` across all their logged, non-discarded sets) for the two
  volume badges, excluding sets with no weight (bodyweight exercises).
- **FR-004**: The system MUST compute, for a given user and exercise, the number
  of distinct (non-discarded) sessions in which at least one set of that exercise
  was logged, for exercise-specific session-count badges.
- **FR-005**: The system MUST detect, at the time a set is logged, whether it is
  the heaviest weight ever logged by that user for that exercise, and persist
  this as a personal record if so. "Heaviest" compares weight only, independent
  of reps (no estimated-1RM formula in this pass - see Assumptions).
- **FR-006**: The system MUST count a user's total number of personal records
  for the PR-count badges ("First PR", "50 PRs").
- **FR-007**: The system MUST compute bodyweight-ratio badge progress by
  comparing a user's current profile bodyweight (`profiles.bodyweight`) against
  their heaviest-ever recorded set for the relevant exercise; a badge with no
  bodyweight on file, or no PR yet for that exercise, MUST show as not-yet-achieved
  rather than erroring.
- **FR-008**: Personal records and all new badge progress MUST be scoped to the
  authenticated account via Supabase Row Level Security, consistent with every
  other table in the app.
- **FR-009**: Discarded sessions MUST NOT contribute to any new badge category or
  to personal-record detection, matching how discarded sessions already don't
  count toward existing badges.
- **FR-010**: The existing Challenges tab UI MUST surface all new badges using
  the same achieved/grayed-out presentation already used for
  `lifetime_workouts`/`streak` badges, requiring no new screen.

### Key Entities

- **Badge** (extends the existing `badges` catalog table): a definition of one
  achievement - category, threshold, label, and (new) an optional exercise
  reference and an optional ratio multiplier, for exercise-scoped and
  bodyweight-ratio badges.
- **PersonalRecord** (new): one row per user+exercise+achieved-weight event -
  records that a specific logged set was, at the time it was logged, the
  heaviest the user had ever lifted for that exercise. Used both to count PRs
  for the "First PR"/"50 PRs" badges and to answer "what's this user's current
  best" for the ratio badges.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user who completes their very first workout sees "First workout"
  achieved on the Challenges tab without navigating anywhere else or taking any
  extra action.
- **SC-002**: A user's lifetime-volume, monthly-workout, PR-count, and
  bodyweight-ratio badge progress is always visible and correct on the Challenges
  tab based purely on their existing logged history - no backfill step or manual
  recalculation is required for badges to reflect sessions logged before this
  feature shipped.
- **SC-003**: Viewing the Challenges tab with zero logged history, or with no
  bodyweight on file, never produces an error - only not-yet-achieved badges.
- **SC-004**: A discarded (never-finished) session has zero effect on any badge
  or personal record, verified by discarding a session that would otherwise have
  tipped a badge into achieved.

## Assumptions

- **PR definition**: a personal record is the heaviest single-set weight ever
  logged for an exercise, independent of reps. This keeps the beginner-facing
  bar simple (matches this app's existing bias toward simple over
  advanced-analytics, e.g. no estimated-1RM anywhere today) and can be
  revisited if a future spec wants rep-weighted PRs.
- **Bodyweight source**: per the user's own choice, this spec uses the existing
  single current-value `profiles.bodyweight` field (already collected in profile
  setup) rather than adding bodyweight history tracking. A consequence: ratio
  badges are recomputed against whatever bodyweight is on file *now*, not the
  bodyweight at the time a PR was set - an already-achieved ratio badge can
  become un-achieved if the user later raises their recorded bodyweight. This is
  accepted as the simplest option; a future spec could add timestamped bodyweight
  history if this proves confusing in practice.
- **"Bench" and "Squat" exercise mapping**: "100 bench sessions" and "Bench
  bodyweight" map to the existing `barbell-bench-press` exercise; "Squat 1.5x
  bodyweight" maps to the existing `barbell-squat` exercise. Both already exist
  in the curated exercise library.
- **"Deadlift 2x bodyweight" exercise mapping - resolved**: the exercise library
  does not currently contain a plain conventional/barbell deadlift - only
  variants (Romanian Deadlift, sumo deadlift, kettlebell deadlift, single-leg
  deadlift). Per user decision, User Story 5's implementation must first add a
  proper `barbell-deadlift` ("Barbell Deadlift" or "Deadlift") exercise to the
  curated library - same pattern as `barbell-squat`/`barbell-bench-press` (a
  real wger-hosted photo, correct muscle group/equipment) - and the badge
  targets that new exercise at 2x bodyweight.
- **Scope boundary**: this spec is achievements/badges only. Auto PR-detection
  *notifications* (the "New Bench Press PR" toast), plateau detection, volume
  recommendations, recovery recommendations, symmetry tracking, and the weekly
  composite score from the original request are deferred to a follow-up spec,
  which can build on this spec's `PersonalRecord` table and volume-aggregation
  work rather than starting from scratch.
- Existing badge presentation (achieved-first, then ascending by threshold,
  grayed-out for unachieved) is reused as-is for every new badge; no redesign of
  the Challenges tab layout is in scope.
