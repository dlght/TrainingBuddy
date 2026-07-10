# Feature Specification: Session Polish, Account Menu, Favourites, and Challenges

**Feature Branch**: `007-polish-and-challenges`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "1) I want to be able to see the last screen with
overall time and rate the workout even if i end it early (don't fill all the
sets). 2) I have to be able to edit rest time for each exercise in the
workout - currently its static not configurable 3) i want to see who is
logged in the right corner and hamburger menu with profile and sign out
options in the right corner of the app 4) i want to be able to add sample
workouts as favourites for the user too.. 5) i want to implement challenges
tab with challenges for the user -> total lifetime workouts badge 10, 50,
100, 200, 500, 1000 badges. badge for streaks -> 1,2,3,5,7,10,14,30 days
consecutive workouts. every user can earn those badges and you see
undiscovered badges for the user grayed out and achieved at the top. 6) on
the history screen sort workouts by the latest at the top not at the bottom
as of now."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - End a workout early and still get the summary (Priority: P1)

A user is mid-workout, decides to stop before every planned set is logged
(ran out of time, felt off, whatever), and wants the same "you're done" wrap
screen they'd get on a full completion: total time, an effort rating, and the
session saved as completed with only the sets they actually logged — not
forced into an all-or-nothing choice between finishing every set or
discarding the whole session.

**Why this priority**: Today the rating screen only appears once every
planned set is logged; ending early means the only other option is "Discard
session," which throws the whole workout away. That's a real data-loss trap
for the single most common real-world interruption (short on time, tired,
distracted) and it directly undermines history/streak/dashboard accuracy.

**Independent Test**: Start a session with 3 exercises, log sets for the
first exercise only, tap "End workout" → land on the same summary screen a
full completion shows (elapsed time, effort rating picker) → confirm → the
session appears in history with just the sets actually logged.

**Acceptance Scenarios**:

1. **Given** an active session with unlogged planned sets remaining, **When**
   the user taps "End workout," **Then** they see the workout-complete
   summary (elapsed time, effort rating picker) instead of only being offered
   "Discard session."
2. **Given** the early-end summary screen, **When** the user picks a rating
   and confirms, **Then** the session is saved as completed with `ended_at`
   set to the moment they chose to end it, and only the sets actually logged
   are recorded.
3. **Given** the early-end summary screen, **When** the user backs out
   without confirming, **Then** the session remains active and resumable,
   unchanged.
4. **Given** a session with zero sets logged, **When** the user ends it
   early, **Then** they can still reach and confirm the summary screen (an
   empty/very short workout is not a special error case).

---

### User Story 2 - History shows the newest workout first (Priority: P1)

A user opens their workout history and expects the most recent session at
the top of the list, matching every other reverse-chronological list in the
app (dashboard, suggestions).

**Why this priority**: Trivial to fix, but it's wrong every single time
someone checks what they just did — high-frequency, high-visibility, and
currently backwards.

**Independent Test**: Log three completed sessions on the same day → open
History, select that day → the most recently completed session appears
first, oldest last.

**Acceptance Scenarios**:

1. **Given** multiple completed sessions on the same day, **When** the user
   views that day in History, **Then** they are listed most-recent-first.
2. **Given** completed sessions across different days, **When** the user
   browses History, **Then** later days' sessions are never listed after
   earlier days' sessions within the same view.

---

### User Story 3 - Configure rest time per exercise (Priority: P2)

While building or editing a workout, a user sets how long the rest timer
should count down for each individual exercise, instead of every exercise in
every workout using the same fixed default during a session.

**Why this priority**: Rest needs genuinely differ by exercise (e.g. heavy
compound lifts vs. finishers); the value already exists per exercise in the
data model but is neither editable nor actually used during a session today,
making it a real functional gap rather than a nice-to-have.

**Independent Test**: Create a workout with two exercises, set exercise A's
rest to 30s and exercise B's to 120s, start a session, log a set on each →
the rest timer counts down from the value configured for whichever exercise
was just logged.

**Acceptance Scenarios**:

1. **Given** the workout builder, **When** the user adds or edits an
   exercise, **Then** they can set its target rest time in seconds.
2. **Given** a workout with different rest times configured per exercise,
   **When** a session for that workout is run, **Then** the rest timer after
   logging a set uses that specific exercise's configured rest time, not a
   single fixed value shared by the whole workout.
3. **Given** a rest-time field left blank or set to an invalid value,
   **When** the user tries to save the workout, **Then** a clear inline
   validation error appears and a sensible default is not silently
   substituted without the user seeing it.

---

### User Story 4 - See who's signed in and sign out from anywhere (Priority: P2)

From any authenticated screen, a user can glance at the top-right corner to
see whose account they're using, and open a menu offering "Profile" and
"Sign out" without navigating away first.

**Why this priority**: Account awareness and sign-out currently live only on
the dedicated profile screen; surfacing them globally is table-stakes account
hygiene for a multi-account app, but it doesn't block core logging value.

**Independent Test**: From the dashboard, tap the top-right menu → see the
signed-in email → tap "Sign out" → land back on sign-in. Repeat from another
top-level screen (Workouts, History) to confirm it's reachable everywhere.

**Acceptance Scenarios**:

1. **Given** a signed-in user on any top-level authenticated screen, **Then**
   a menu entry point is visible in the top-right corner.
2. **Given** the user opens that menu, **Then** they see the signed-in
   account's email and options for "Profile" and "Sign out."
3. **Given** the user taps "Sign out" from the menu, **When** confirmed,
   **Then** their session ends and they're returned to sign-in, same as
   signing out from the profile screen today.
4. **Given** the user taps "Profile" from the menu, **Then** they're taken to
   the existing profile screen.

---

### User Story 5 - Favourite a sample workout (Priority: P2)

A user browsing the built-in sample workouts marks one as a favourite, the
same way they already can for their own custom workouts, so it's easy to find
again and gets prioritized in suggestions — without that favourite being
visible to or shared with any other account.

**Why this priority**: Favouriting already exists for custom workouts;
sample workouts are excluded today purely because they're shared reference
rows, not an intentional design choice. Closing that gap is small but
meaningfully improves daily workout selection.

**Independent Test**: Open the Workouts screen, favourite a sample workout →
it shows as favourited and is prioritized in dashboard suggestions the same
way a favourited custom workout is. Sign in as a second account → the same
sample workout shows as not favourited for that account.

**Acceptance Scenarios**:

1. **Given** the Workouts screen's sample-workouts section, **When** the user
   taps the favourite toggle on a sample workout, **Then** it shows as
   favourited, matching the existing toggle already available on custom
   workouts.
2. **Given** a sample workout favourited by one account, **When** a different
   account views the same sample workout, **Then** it shows as not
   favourited — favouriting a shared sample workout MUST NOT be visible to or
   alter it for any other account.
3. **Given** a favourited sample workout, **When** the dashboard computes
   suggested workouts, **Then** it is prioritized the same way a favourited
   custom workout already is.

---

### User Story 6 - Earn challenge badges for consistency (Priority: P3)

A user opens a new Challenges tab and sees two badge tracks: total lifetime
workouts completed (10, 50, 100, 200, 500, 1000) and consecutive-day workout
streaks (1, 2, 3, 5, 7, 10, 14, 30 days). Badges they've already earned show
unlocked and sorted to the top; badges they haven't reached yet show grayed
out below, still showing what's required to unlock them.

**Why this priority**: The biggest net-new surface in this batch — a full
tab, a badge catalog, and progress computation — so it lands last, after the
smaller fixes and gaps above ship. It's genuine motivational/engagement value
once the core logging experience it depends on (accurate history, accurate
streaks) is solid.

**Independent Test**: As an account with 15 prior lifetime completed
workouts and a 3-day current streak, open the Challenges tab for the first
time → the "10 workouts," "1 day," "2 day," and "3 day" badges already show
unlocked at the top, with the rest grayed out below showing their
requirement.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open the Challenges tab,
   **Then** they see all lifetime-workout badges and all streak badges, each
   showing its threshold.
2. **Given** a badge whose threshold the user's account has already reached
   — including from workouts logged before this feature existed — **Then**
   it renders as achieved and is sorted above not-yet-achieved badges.
3. **Given** a badge whose threshold hasn't been reached, **Then** it renders
   in a visibly locked/grayed state, not hidden.
4. **Given** a user whose current streak later resets to 0 after previously
   reaching a streak badge's threshold, **When** they revisit the Challenges
   tab, **Then** that streak badge still shows as achieved — streak badges,
   once earned, are permanent.
5. **Given** a user completes a workout that crosses a lifetime-count or
   streak threshold, **When** they next open the Challenges tab, **Then**
   the newly earned badge shows as achieved.

---

### Edge Cases

- What happens when a user taps "End workout" with zero sets logged? They can
  still reach and confirm the summary screen rather than being blocked or
  forced to discard (User Story 1).
- What happens when two sessions complete at the exact same timestamp? History
  ordering MUST use a stable secondary tiebreaker so ordering doesn't jump
  around between loads (User Story 2).
- What happens when a rest-time field is left blank, zero, or negative? The
  workout builder MUST reject it with an inline error rather than silently
  falling back to a default (User Story 3).
- What happens when the account menu is opened with a profile that has no
  display name set? It MUST still show the signed-in email (User Story 4).
- What happens when a user un-favourites a sample workout? It MUST drop out
  of their favourited set without affecting the shared template row or any
  other account's favourite state (User Story 5).
- What happens when a user has never completed a workout and opens the
  Challenges tab? All badges show locked/grayed with their requirements
  visible; nothing errors on an empty history (User Story 6).
- What happens when a device is offline and any of these screens (Challenges,
  account menu, favourites, rest-time edit) tries to load or save? A clear
  "can't reach the server" state MUST appear, consistent with the rest of the
  app (constitution Principle II).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a user end an active session before every
  planned set is logged ("End workout early") without discarding the sets
  already logged.
- **FR-002**: On early end, system MUST present the same completion summary
  (elapsed time, effort rating picker) shown on a full completion, computed
  from only the sets actually logged.
- **FR-003**: Confirming the early-end summary MUST save the session as
  completed with `ended_at` set to the moment the user chose to end it;
  declining/backing out MUST leave the session active and resumable,
  unchanged.
- **FR-004**: History MUST list completed sessions most-recent-first by
  completion time, with a stable tiebreaker for equal timestamps.
- **FR-005**: The workout builder MUST let a user set a target rest time (in
  seconds) per exercise when creating or editing a workout, with inline
  validation rejecting blank, zero, or negative values.
- **FR-006**: The active session's rest timer MUST use the specific
  exercise's configured target rest time after each logged set, not a single
  fixed value applied across the whole workout.
- **FR-007**: Every top-level authenticated screen MUST show a menu entry
  point in the top-right corner revealing the signed-in account's email, with
  options to open the profile screen and to sign out.
- **FR-008**: Signing out from this menu MUST behave identically to the
  existing sign-out on the profile screen (session cleared, returned to
  sign-in).
- **FR-009**: Users MUST be able to favourite and unfavourite sample
  (template) workouts, in addition to the existing favouriting of custom
  workouts.
- **FR-010**: A favourited sample workout MUST be personal to the favouriting
  account — it MUST NOT change how that same shared sample workout appears to
  any other account.
- **FR-011**: Favourited sample workouts MUST participate in the existing
  workout-suggestion prioritization the same way favourited custom workouts
  already do.
- **FR-012**: System MUST provide a Challenges tab listing lifetime-completed-
  workout badges at thresholds 10, 50, 100, 200, 500, 1000, and
  consecutive-day-streak badges at thresholds 1, 2, 3, 5, 7, 10, 14, 30.
- **FR-013**: Badge achievement MUST be computed from the account's complete
  history at the time the tab is viewed, including activity from before this
  feature shipped — an eligible account MUST NOT start at zero.
- **FR-014**: Streak badges MUST be based on the longest streak the account
  has ever reached, not the currently active streak, so an earned streak
  badge remains achieved even after the current streak later resets.
- **FR-015**: Achieved badges MUST render visually distinct from and sorted
  above not-yet-achieved badges; not-yet-achieved badges MUST still render
  (grayed out) with their threshold visible, not hidden.

### Key Entities

- **Badge**: Reference definition of an earnable badge (category:
  lifetime-workouts or streak; threshold; label) — global, shared across all
  accounts, not user-scoped, same shape as existing reference data like
  Exercise/MuscleGroup.
- **Badge Award**: Per-account record that a given badge has been earned
  (account id, badge, earned-at timestamp) — user-scoped like other personal
  data, protected the same way workouts/sessions already are.
- **Sample Workout Favourite**: Per-account bookmark on a shared sample
  (template) workout — distinct from the existing favourite flag on
  user-owned custom workouts, since a template row is shared across every
  account and can't hold a single global favourite state.
- **WorkoutExercise.targetRestSeconds**: Existing attribute, extended from a
  write-once default to a user-editable, per-exercise value that the active
  session actually reads.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user who ends a workout after logging only some of the
  planned sets still reaches and confirms a rating screen in the same flow,
  with the session saved as completed rather than lost.
- **SC-002**: Two exercises in the same workout with different configured
  rest times produce different rest-timer countdowns in the same session.
- **SC-003**: The signed-in account's email and a sign-out option are
  reachable within two taps from every top-level authenticated screen.
- **SC-004**: Two different accounts each favouriting the same sample
  workout see independent favourite states — never each other's.
- **SC-005**: Three same-day completed sessions always list most-recent-first
  in History, verified across repeated loads.
- **SC-006**: An account with 15 prior lifetime completed workouts sees the
  "10 workouts" badge already unlocked the first time it opens the
  Challenges tab, with no manual recalculation step.

## Assumptions

- Badges cover lifetime-workout-count and consecutive-day-streak categories
  only for this phase; no other challenge types (volume, specific exercises,
  time-of-day, etc.) are in scope.
- The account menu is a lightweight dropdown/action-sheet anchored to a
  top-right entry point, not a full drawer navigator — it satisfies "hamburger
  menu with profile and sign out" without introducing a new navigation
  pattern alongside the existing bottom nav.
- Favouriting a sample workout is a personal bookmark/priority signal only;
  it does not copy the template into the user's own custom workouts — the
  existing separate "copy template" action still handles that.
- "Ending a workout early" still requires the user to confirm through the
  same rating/summary step as a full completion; there is no separate silent
  one-tap discard-as-complete shortcut introduced.
- Rest-time validation follows the same inline-error pattern already used
  elsewhere in the workout builder (e.g. reps/weight fields).
- This phase is additive to specs 001-006 and does not amend the
  constitution; gamification (Principle IV) is scoped narrowly to the two
  badge categories explicitly requested, not a general achievements system.
