# Feature Specification: Session Duration, Streaks, and Effort Rating

**Feature Branch**: `005-session-stats-and-media`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "1. i want to add total time to the workouts -> start to finish. 2. total time should display on the finish screen with big numbers in the center of the screen. 3. it should exist in the history of the workouts also. 4. search when updating new exercises is not working -> i want to write key word that is contained in an exercise and it to show filtered so i can add it. 5. i want to add basic pictures that describe the seeded exercises for the initial workouts. 6. i want to add streak to the workout tracking -> for example if you have worked out 2 days in a row i want to display this on the dashboard and on finish to mark the streak counter so i know how many days in a row i worked out. 7. i want to be able to rate the workout on finish from 1-5 (where 1 is 'in my sleep', 2 is 'could do more', 3 is 'right there', 4 is 'almost done it' and 5 is 'impossible'). think of a smart way to show that rates and keep the rate in the workout history - we can implement smart suggestions based on the effort later. the rate is for the whole exercise.

Descoped for this pass: item 4 (create-flow exercise search) and item 5 (seed exercise images, user will supply image files separately) are dropped from this spec. Open question resolved: the effort rating is once per session (captured on the single finish screen), not per individual exercise."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Total Workout Duration on the Finish Screen (Priority: P1)

A user finishes a workout and immediately sees how long it took, start to finish, displayed prominently (large text, centered) on the workout-complete screen.

**Why this priority**: Smallest, most self-contained payoff in this batch — start/end timestamps already exist in the schema, so this is a pure display feature with no new data risk, and it's the most requested item ("big numbers in the center of the screen").

**Independent Test**: Start a session, log at least one set, wait a measurable amount of time, tap Finish. Confirm the complete-state screen shows a large, centered elapsed-time readout that reflects the real wall-clock time between session start and finish.

**Acceptance Scenarios**:

1. **Given** an active session that reaches the "workout complete" state, **When** the screen renders, **Then** it shows the elapsed time from session start to now, in large text, centered on the screen.
2. **Given** a session the user finishes, **When** "Finish session" is tapped, **Then** the persisted duration matches the real elapsed time between `startedAt` and `endedAt` (not the time the complete-state screen happened to be viewed for).
3. **Given** a session lasting under a minute, **When** duration is displayed, **Then** it shows a sensible short format (e.g. seconds or "0m") rather than a blank or malformed value.

---

### User Story 2 - Workout Duration Shown in History (Priority: P2)

A user browsing their workout history sees how long each past session took, alongside the other per-session details already shown (name, date, sets, volume).

**Why this priority**: Depends on the duration calculation introduced in User Story 1, then reuses it in a second, lower-urgency surface.

**Independent Test**: Finish a workout, open History, and confirm the session's card shows its duration alongside its existing details.

**Acceptance Scenarios**:

1. **Given** one or more completed sessions in history, **When** the user views the history list, **Then** each session card shows its duration (start to finish).
2. **Given** a session completed before this feature shipped (no explicit duration calculation existed yet), **When** it appears in history, **Then** its duration is still computed correctly from its existing `startedAt`/`endedAt` values (no backfill or migration needed, since both timestamps were already recorded).

---

### User Story 3 - Workout Streak on Dashboard and Finish Screen (Priority: P2)

A user who works out on consecutive calendar days sees a streak counter — e.g. "2-day streak" — on the home dashboard, and sees it confirmed/updated the moment they finish a workout that extends it.

**Why this priority**: A motivating, habit-reinforcing feature that depends on session history existing (already shipped) but is independent of duration/rating; ranked alongside duration-in-history as a moderate-effort addition.

**Independent Test**: Complete a workout today and confirm the dashboard shows a 1-day streak. Complete another workout tomorrow (or simulate a session dated the next calendar day) and confirm the streak shows 2, both on the dashboard and on that session's finish screen. Skip a day and confirm the streak resets to 1 on the next workout.

**Acceptance Scenarios**:

1. **Given** completed sessions on two or more immediately consecutive calendar days (today included), **When** the user views the dashboard, **Then** it shows the current streak length in days.
2. **Given** no completed session today and no completed session yesterday, **When** the user views the dashboard, **Then** no active streak is shown (or it shows 0), rather than a stale prior count.
3. **Given** a user finishes a workout that extends their current streak, **When** the finish screen renders, **Then** it shows the updated streak count reflecting today's session.
4. **Given** a user completes two sessions on the same calendar day, **When** the streak is computed, **Then** that day counts once, not twice.
5. **Given** a user last worked out two or more days ago, **When** they finish a new workout today, **Then** the streak resets to 1 (today), not continuing the old count.

---

### User Story 4 - Rate Workout Effort 1-5 on Finish (Priority: P3)

A user finishing a workout can optionally rate how hard it felt, on a 1-5 scale with plain-language labels (1 "In my sleep" through 5 "Impossible"), and that rating is saved with the session so it's visible later in history. The rating applies to the whole session, once — not per individual exercise.

**Why this priority**: Adds a new, previously-nonexistent data point (not just a display of existing data like Stories 1-3), and the user explicitly deferred any "smart suggestions" use of it to a later phase — so this ships as capture-and-display only.

**Independent Test**: Finish a workout, select an effort rating from the 5 labeled options, confirm the session saves successfully, then open history and confirm that session shows the chosen rating. Separately, finish a workout without selecting a rating and confirm it still saves and shows an honest "not rated" state in history.

**Acceptance Scenarios**:

1. **Given** the workout-complete screen, **When** the user views it, **Then** they see 5 selectable effort options labeled 1 "In my sleep", 2 "Could do more", 3 "Right there", 4 "Almost couldn't do it", 5 "Impossible", presented once for the whole session (not per exercise).
2. **Given** the user selects a rating and taps "Finish session", **When** the session saves, **Then** the selected rating (1-5) is persisted with that session.
3. **Given** the user does not select a rating, **When** they tap "Finish session", **Then** the session still saves successfully with no rating recorded (rating is optional, not a blocker).
4. **Given** a completed session with a rating, **When** the user views it in history, **Then** the rating is shown using a clear visual treatment (e.g. label and/or icon), not a bare number.
5. **Given** a completed session without a rating, **When** the user views it in history, **Then** an honest "not rated" state is shown rather than a default/misleading value like "1".

---

### Edge Cases

- What happens if the app is closed/backgrounded mid-session and reopened later? Duration MUST reflect real wall-clock time from `startedAt` to `endedAt`, not time-while-app-was-open only.
- What happens to duration/streak/rating when a session is discarded rather than finished? None of the three are recorded or counted — discarded sessions do not extend a streak, do not get a duration shown anywhere persistent, and are never rated.
- What happens when a session's `startedAt` and `endedAt` fall on different calendar days (started just before midnight)? Streak bucketing uses the session's `endedAt` date, consistent with how history already orders sessions by `endedAt`.
- What happens when the device's local clock changes (timezone travel, manual clock change) between sessions? Streak and duration use the device's local calendar day/wall-clock time at the time each timestamp was recorded; this feature does not add cross-timezone reconciliation beyond what already exists for timestamps in this app.
- What happens on a user's very first completed session ever? Streak shows 1 day; history shows one entry with its duration; no error from "no prior session".
- What happens when local data (existing `workout_sessions` rows) was created before this feature shipped, with no rating recorded? Duration still computes correctly from existing `startedAt`/`endedAt`; rating shows "not rated" rather than a default guess or crash.
- What happens when local data was created with an older SQLite schema (no rating column)? It MUST self-heal on next launch following this project's established migration pattern, with no data loss.
- What happens when the device is offline or in airplane mode? All flows in this feature (duration, streak, rating) MUST work fully offline.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST compute a session's total duration as the elapsed wall-clock time between its `startedAt` and `endedAt` timestamps.
- **FR-002**: The workout-complete screen MUST display elapsed time in large, centered text; while the session is not yet finished, it MUST show live elapsed time (start to now); once finished, the persisted duration MUST be based on the actual `startedAt`-to-`endedAt` delta.
- **FR-003**: Each session card in workout history MUST display that session's total duration.
- **FR-004**: The app MUST compute the user's current workout streak as the number of immediately-consecutive calendar days (ending today or yesterday) with at least one completed session.
- **FR-005**: A day with two or more completed sessions MUST count once toward the streak, not multiple times.
- **FR-006**: The dashboard MUST display the current streak length.
- **FR-007**: The finish/workout-complete screen MUST display the streak count as updated by the session just being finished.
- **FR-008**: If the most recent completed session (before today) was not yesterday or today, the streak MUST reset to count only the current session, not continue a stale prior count.
- **FR-009**: The workout-complete screen MUST offer 5 selectable effort-rating options, presented once per session (not per exercise), labeled exactly: 1 "In my sleep", 2 "Could do more", 3 "Right there", 4 "Almost couldn't do it", 5 "Impossible".
- **FR-010**: Selecting an effort rating MUST be optional; finishing a session without selecting one MUST still succeed and persist the session with no rating.
- **FR-011**: A session's effort rating, when selected, MUST be persisted with that session and remain visible on that session in history afterward.
- **FR-012**: History MUST render a session's effort rating with a clear, non-numeric-only visual treatment (e.g. label and/or icon per level), and MUST render an explicit "not rated" state for sessions with no rating.
- **FR-013**: Existing local databases without an effort-rating column MUST self-heal to the new schema on next launch with no data loss, consistent with this project's established migration pattern (verified against a simulated pre-existing/drifted device, not just a fresh install).
- **FR-014**: All flows introduced by this feature (duration display, streak, effort rating) MUST function fully offline.

### Key Entities

- **Workout Session**: Gains a derived "duration" (computed from its existing `startedAt`/`endedAt`, no new column needed) and a new optional effort rating (1-5, nullable — new column, only set when the user chooses one, one rating per session).
- **Workout Streak**: A new, computed-not-stored concept — the count of immediately-consecutive calendar days (through today) with at least one completed session for the user, derived from existing completed-session history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can see their workout's total duration, in large centered text, the moment the workout-complete screen appears.
- **SC-002**: Every session in history shows a duration that matches its actual recorded start and end time.
- **SC-003**: A user who works out on consecutive days sees their streak count increase by exactly one per new calendar day worked out, visible on both the dashboard and that day's finish screen.
- **SC-004**: A user can rate a workout's effort in one tap on the finish screen, or skip rating entirely, without either choice blocking the session from saving.
- **SC-005**: All flows in this feature succeed with network access disabled.
- **SC-006**: Duration, streak, and rating data survive app restart and, for existing devices, schema migration without data loss.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than advanced training analytics.
- Features are local-only by default unless remote sync or accounts are explicitly requested and justified.
- "Total time" means wall-clock elapsed time from session start to session finish, computed from the already-existing `startedAt`/`endedAt` timestamps — no new stopwatch/pause mechanic is introduced (a backgrounded app does not pause the clock).
- Discarded sessions do not count toward duration history, streaks, or ratings — only completed sessions do, consistent with how history already excludes discarded sessions.
- Streak day-boundaries use the device's local calendar day at the time a session's `endedAt` was recorded; no timezone-travel reconciliation is introduced beyond what already exists.
- The effort rating is once per session, captured on the single finish screen — confirmed, not per individual exercise. "Smart suggestions based on the effort" are explicitly out of scope for this spec, per the user's own note — this spec only captures and displays the rating.
- Descoped from this pass: create-new-workout exercise search, and seed exercise images (the user will supply image files separately when ready — a future, image-only follow-up can wire them in without needing this spec reopened).
