# Feature Specification: Session Duration, Streaks, and Effort Rating

**Feature Branch**: `005-session-stats-and-media`

**Created**: 2026-07-09

**Status**: Delivered

**Input**: User description: "1. i want to add total time to the workouts -> start to finish. 2. total time should display on the finish screen with big numbers in the center of the screen. 3. it should exist in the history of the workouts also. 4. search when updating new exercises is not working -> i want to write key word that is contained in an exercise and it to show filtered so i can add it. 5. i want to add basic pictures that describe the seeded exercises for the initial workouts. 6. i want to add streak to the workout tracking -> for example if you have worked out 2 days in a row i want to display this on the dashboard and on finish to mark the streak counter so i know how many days in a row i worked out. 7. i want to be able to rate the workout on finish from 1-5 (where 1 is 'in my sleep', 2 is 'could do more', 3 is 'right there', 4 is 'almost done it' and 5 is 'impossible'). think of a smart way to show that rates and keep the rate in the workout history - we can implement smart suggestions based on the effort later. the rate is for the whole exercise.

Descoped for this pass: item 4 (create-flow exercise search) and item 5 (seed exercise images, user will supply image files separately) are dropped from this spec. Open question resolved: the effort rating is once per session (captured on the single finish screen), not per individual exercise."

**Round 2 input** (manual-validation feedback, folded into this still-Draft spec rather than a new phase): "when i start workout i want big timer to appear at the top with counter counting the time. when i finish the last exercise and go to the last screen i want my workout timer to be stopped and i want to press finish workout just to go away from the screen - the finish should be done, only effort should be accounted. on the main screen the streak is going off screen. i want more interactive statistics for what happened with my workouts on the dashboard. and in the history - use higher font for the Date, Duration and effort. Volume can be removed. design the history to look better if i have 200 workouts - i want like a calendar when i went and when i didn't and i can click on a day to see detailed info for the workout?"

**Round 3 input** (further manual-validation feedback, still folded into this still-Draft spec): "i definatelly need more data in the detailed history -> for example number of exercises, return the volume in kg, resting time, working time - that would be great."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persistent Session Timer, Frozen at Completion, One-Tap Finish (Priority: P1)

A user starting a workout sees a big timer at the top of the screen counting up from the moment the session starts, visible throughout every exercise. Once the last exercise's last set is logged and the app lands on the "workout complete" screen, the timer stops counting — it shows the actual time the workout took, not still-ticking time spent deciding whether to finish. Tapping "Finish workout" on that screen immediately completes the session and leaves the screen — it does not show a second confirmation/summary screen first. The only thing the user actively provides on that last screen is, optionally, an effort rating.

**Why this priority**: The most requested and most visible item in this batch. **Amended after Round 1 manual validation**: the original version only showed a live timer on the complete card and required a second "Done" tap on a new summary screen after Finish — validation feedback said the timer should be visible from the start (not just at the end) and stop the moment the workout is actually done, and that Finish should be a single, final action, not a two-step confirmation.

**Independent Test**: Start a session and confirm a large timer at the top begins counting immediately. Log every set through to the last exercise; confirm the timer stops counting the instant the "workout complete" screen appears (not when Finish is tapped). Tap "Finish workout" and confirm the app leaves the session screen immediately, with no intermediate confirmation screen.

**Acceptance Scenarios**:

1. **Given** a session that has just started, **When** the active-session screen renders, **Then** a large timer at the top of the screen begins counting up from zero immediately, with no action required to start it.
2. **Given** an in-progress session (any exercise, any set), **When** the user views the screen, **Then** the timer continues counting live at the top of the screen throughout.
3. **Given** the last set of the last exercise is logged (and rest ends or is skipped), **When** the app shows the "workout complete" screen, **Then** the timer stops counting at that exact moment and displays a fixed (non-ticking) elapsed time from then on.
4. **Given** the frozen elapsed time shown on the "workout complete" screen, **When** the user taps "Finish workout", **Then** the duration persisted with the session matches that frozen value, not whatever additional time passed while choosing an effort rating.
5. **Given** the "workout complete" screen, **When** the user taps "Finish workout" (with or without selecting an effort rating first), **Then** the session is saved immediately and the app navigates away from the session screen in one step — no second confirmation screen or extra tap is required.
6. **Given** a user taps "Finish workout" (or "Discard") before all exercises are logged (already-supported early-finish/discard), **When** the session ends that way, **Then** the persisted duration reflects the actual moment of that tap, since the workout was never "completed" in the auto-freeze sense described above.
7. **Given** a session lasting under a minute, **When** duration is displayed, **Then** it shows a sensible short format (e.g. seconds or "0m") rather than a blank or malformed value.

---

### User Story 2 - Workout Duration Shown in History (Priority: P2)

A user browsing their workout history sees how long each past session took, alongside the other per-session details already shown (name, date, sets, volume).

**Why this priority**: Depends on the duration calculation introduced in User Story 1, then reuses it in a second, lower-urgency surface.

**Independent Test**: Finish a workout, open History, and confirm the session's card shows its duration alongside its existing details.

**Acceptance Scenarios**:

1. **Given** one or more completed sessions in history, **When** the user views the history list, **Then** each session card shows its duration (start to finish).
2. **Given** a session completed before this feature shipped (no explicit duration calculation existed yet), **When** it appears in history, **Then** its duration is still computed correctly from its existing `startedAt`/`endedAt` values (no backfill or migration needed, since both timestamps were already recorded).

---

### User Story 3 - Workout Streak Visible on the Dashboard (Priority: P2)

A user who works out on consecutive calendar days sees a streak counter — e.g. "2-day streak" — on the home dashboard, fully visible and legible (not clipped or pushed off-screen).

**Why this priority**: A motivating, habit-reinforcing feature that depends on session history existing (already shipped) but is independent of duration/rating; ranked alongside duration-in-history as a moderate-effort addition.

**Amended after Round 1 manual validation**: two changes. First, a real layout bug — the streak tile was nested inside the same row as the top-3 suggested-workout bubbles, leaving it almost no width and pushing its content off the visible screen; it now gets its own full-width row, matching the consistency tile. Second, per direct feedback ("only effort should be accounted" on the finish screen), the streak is no longer shown on the session-complete screen — the dashboard is its one home, consistent with User Story 1's simplified one-tap finish.

**Independent Test**: Complete a workout today and confirm the dashboard shows a 1-day streak, fully visible without being clipped or overflowing the screen at any common device width. Complete another workout tomorrow (or simulate a session dated the next calendar day) and confirm the streak shows 2. Skip a day and confirm the streak resets to 1 on the next workout.

**Acceptance Scenarios**:

1. **Given** completed sessions on two or more immediately consecutive calendar days (today included), **When** the user views the dashboard, **Then** it shows the current streak length in days, fully visible within the screen bounds.
2. **Given** no completed session today and no completed session yesterday, **When** the user views the dashboard, **Then** no active streak is shown (or it shows 0), rather than a stale prior count.
3. **Given** a user completes two sessions on the same calendar day, **When** the streak is computed, **Then** that day counts once, not twice.
4. **Given** a user last worked out two or more days ago, **When** they finish a new workout today, **Then** the streak resets to 1 (today), not continuing the old count.

---

### User Story 4 - Rate Workout Effort 1-5 on Finish (Priority: P3)

A user finishing a workout can optionally rate how hard it felt, on a 1-5 scale with plain-language labels (1 "In my sleep" through 5 "Impossible"), and that rating is saved with the session so it's visible later in history. The rating applies to the whole session, once — not per individual exercise.

**Why this priority**: Adds a new, previously-nonexistent data point (not just a display of existing data like Stories 1-3), and the user explicitly deferred any "smart suggestions" use of it to a later phase — so this ships as capture-and-display only.

**Independent Test**: Finish a workout, select an effort rating from the 5 labeled options, confirm the session saves successfully, then open history and confirm that session shows the chosen rating. Separately, finish a workout without selecting a rating and confirm it still saves and shows an honest "not rated" state in history.

**Acceptance Scenarios**:

1. **Given** the workout-complete screen, **When** the user views it, **Then** they see 5 selectable effort options labeled 1 "In my sleep", 2 "Could do more", 3 "Right there", 4 "Almost couldn't do it", 5 "Impossible", presented once for the whole session (not per exercise).
2. **Given** the user selects a rating and taps "Finish workout", **When** the session saves, **Then** the selected rating (1-5) is persisted with that session.
3. **Given** the user does not select a rating, **When** they tap "Finish workout", **Then** the session still saves successfully with no rating recorded (rating is optional, not a blocker) — per User Story 1, this single tap is also what ends the session and leaves the screen.
4. **Given** a completed session with a rating, **When** the user views it in history, **Then** the rating is shown using a clear visual treatment (e.g. label and/or icon), not a bare number.
5. **Given** a completed session without a rating, **When** the user views it in history, **Then** an honest "not rated" state is shown rather than a default/misleading value like "1".

---

### User Story 5 - Interactive Weekly Trend Chart on the Dashboard (Priority: P4)

A user viewing the dashboard's weekly volume chart can tap a day's bar to see that day's actual numbers (sets and volume), instead of only seeing an unlabeled bar height.

**Why this priority**: Direct feedback ("i want more interactive statistics for what happened with my workouts on the dashboard"), scoped to the smallest concrete version of that ask per the user's own follow-up choice: make the existing chart tappable rather than building new chart types this round.

**Independent Test**: View the dashboard with at least one day of logged volume in the trend chart. Tap that day's bar and confirm a detail line appears showing that day's set count and volume. Tap it again (or tap another day) and confirm the detail updates accordingly.

**Acceptance Scenarios**:

1. **Given** the weekly trend chart, **When** the user taps a day's bar, **Then** that day becomes visually selected and a detail line shows that day's set count and volume.
2. **Given** a day with zero logged volume, **When** the user taps its bar, **Then** the detail line honestly shows zero sets/volume rather than hiding or erroring.
3. **Given** a day is already selected, **When** the user taps a different day, **Then** the selection and detail line update to the newly tapped day.

---

### User Story 6 - History Redesigned for Scale: Month Calendar View (Priority: P3)

A user with many months of workout history (validated against a target of ~200 past workouts) sees their history as a calendar they can browse month by month, with worked-out days visibly marked. Tapping a marked day shows that day's workout(s) in detail. The flat, ever-growing list this replaces does not scale to that volume of history.

**Why this priority**: Directly requested ("design the history to look better if i have 200 workouts... like a calendar"), and addresses a real scale problem with the History screen shipped earlier in this same spec (a flat list with no pagination or grouping). Ranked above the dashboard chart tweak (User Story 5) since it's a bigger, more clearly-specified request, but below the core session-timer/finish fix (User Story 1).

**Independent Test**: With several dozen completed sessions spread across multiple months, open History and confirm a calendar for the current month renders with worked-out days visibly marked and other days visibly not. Navigate to a previous month and confirm it reflects that month's actual workout days. Tap a marked day and confirm that day's session(s) appear with detail (workout name, duration, effort rating).

**Acceptance Scenarios**:

1. **Given** the History screen, **When** it opens, **Then** it shows a calendar grid for the current month, with each day that has one or more completed sessions visibly marked and days without a session visibly unmarked.
2. **Given** the calendar for the current month, **When** the user navigates to the previous or next month, **Then** the grid updates to show that month's actual worked-out days.
3. **Given** a marked day, **When** the user taps it, **Then** that day's session(s) are shown with the same improved detail as User Story 7 (larger date/duration/effort type, no volume).
4. **Given** an unmarked day, **When** the user taps it, **Then** nothing breaks — either no detail is shown or an honest "no workout this day" state appears.
5. **Given** a day with more than one completed session, **When** the user taps it, **Then** all of that day's sessions are shown (not just one), each individually reachable.
6. **Given** today's date has a completed session, **When** History first opens, **Then** today is selected by default so the most relevant detail is visible without an extra tap; otherwise no day is pre-selected.

---

### User Story 7 - History Typography and Richer Session Detail (Priority: P5)

A user viewing a session's detail in History sees the Date, Duration, and Effort rating in a noticeably larger, easier-to-scan type size, and sees more of what actually happened that session: how many exercises were performed, total volume lifted (with a weight unit attached), how much of the session was spent resting, and how much was spent actively working.

**Why this priority**: Small, isolated polish request, layered on top of User Story 6's bigger structural change; ordered last as the lowest-risk, lowest-effort item in this batch.

**Amended after further manual-validation feedback (Round 3)**: Round 2 removed Total Volume from the card entirely on the user's own request. Direct follow-up feedback asked for it back, with a unit attached, plus three more data points: exercise count, resting time, and working time. Volume's removal is superseded by this amendment — it is shown again, now with its unit.

**Independent Test**: Open History, select a day with a session, and confirm the Date, Duration, and Effort rating render in a visibly larger type than the original flat-list version, and that the card also shows the number of exercises performed, total volume with a weight-unit label, resting time, and working time.

**Acceptance Scenarios**:

1. **Given** a session's detail card in History, **When** it renders, **Then** the Date, Duration, and Effort rating use a larger font size than the original flat-list version.
2. **Given** a session's detail card in History, **When** it renders, **Then** it shows the number of distinct exercises performed that session.
3. **Given** a session's detail card in History, **When** it renders, **Then** it shows total volume lifted with the user's configured weight unit attached (e.g. "1,240 kg"), not a bare number.
4. **Given** a session's detail card in History, **When** it renders, **Then** it shows resting time and working time as two distinct figures, together accounting for the session's total duration.
5. **Given** a session with only one logged set (no gaps between sets to measure), **When** resting/working time is computed, **Then** resting time shows as zero and working time shows the full session duration, rather than an error or blank value.

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
- What happens if the user backgrounds the app while the session timer is running (mid-workout, before the freeze)? The displayed timer MUST reflect real wall-clock elapsed time on return, not time-while-foregrounded only, consistent with the existing duration-calculation rule above.
- What happens if the user is on the "workout complete" screen (timer already frozen) and backgrounds/returns the app before tapping Finish? The frozen value MUST remain frozen — it does not resume counting.
- What happens when a calendar month has zero completed sessions? The month still renders with no days marked, rather than an error or blank screen.
- What happens when the user navigates the history calendar far into the future or before the app's install date? Future months render with no marked days (nothing to show yet); navigation does not error.
- What happens when the dashboard trend chart's selected day scrolls out of the visible window (e.g. after time passes and the 6-day window shifts)? The selection simply no longer matches a rendered bar; it does not crash — the next tap re-establishes a valid selection.



## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST compute a session's total duration as the elapsed wall-clock time between its `startedAt` and `endedAt` timestamps.
- **FR-002**: The active-session screen MUST display a large timer at the top of the screen, counting up live from the moment the session starts, visible throughout every exercise.
- **FR-002a**: The timer MUST stop counting the instant the session reaches the "workout complete" state (last set of the last exercise logged, rest ended or skipped) and MUST display that frozen elapsed time from then on, not continuing to tick while the user decides whether to finish.
- **FR-002b**: The duration persisted when the session is finished from the "workout complete" state MUST match the frozen value shown (FR-002a), not whatever additional wall-clock time passed while on that screen.
- **FR-002c**: If the user finishes or discards a session before it reaches the "workout complete" state, the persisted duration MUST reflect the actual moment of that action instead (no freeze applies, since the workout was never auto-completed).
- **FR-002d**: Tapping "Finish workout" on the "workout complete" screen MUST complete and save the session and navigate away in a single action — no additional confirmation or summary screen may be interposed.
- **FR-003**: Each session card in workout history MUST display that session's total duration.
- **FR-004**: The app MUST compute the user's current workout streak as the number of immediately-consecutive calendar days (ending today or yesterday) with at least one completed session.
- **FR-005**: A day with two or more completed sessions MUST count once toward the streak, not multiple times.
- **FR-006**: The dashboard MUST display the current streak length, fully visible within the screen's bounds (not clipped, truncated, or pushed off-screen by neighboring elements).
- ~~FR-007~~: Removed in Round 2 — the finish screen no longer displays the streak (see User Story 3's Round 2 amendment); the dashboard is its sole display surface per FR-006.
- **FR-008**: If the most recent completed session (before today) was not yesterday or today, the streak MUST reset to count only the current session, not continue a stale prior count.
- **FR-009**: The workout-complete screen MUST offer 5 selectable effort-rating options, presented once per session (not per exercise), labeled exactly: 1 "In my sleep", 2 "Could do more", 3 "Right there", 4 "Almost couldn't do it", 5 "Impossible".
- **FR-010**: Selecting an effort rating MUST be optional; finishing a session without selecting one MUST still succeed and persist the session with no rating.
- **FR-011**: A session's effort rating, when selected, MUST be persisted with that session and remain visible on that session in history afterward.
- **FR-012**: History MUST render a session's effort rating with a clear, non-numeric-only visual treatment (e.g. label and/or icon per level), and MUST render an explicit "not rated" state for sessions with no rating.
- **FR-013**: Existing local databases without an effort-rating column MUST self-heal to the new schema on next launch with no data loss, consistent with this project's established migration pattern (verified against a simulated pre-existing/drifted device, not just a fresh install).
- **FR-014**: All flows introduced by this feature (duration display, streak, effort rating, dashboard chart interaction, history calendar) MUST function fully offline.
- **FR-015**: The dashboard's weekly trend chart MUST let the user tap a day's bar to see that day's set count and volume as a detail line, updating when a different day is tapped.
- **FR-016**: The History screen MUST present a month calendar grid (not only a flat chronological list) with days that have one or more completed sessions visibly distinguishable from days without one.
- **FR-017**: The History calendar MUST support navigating to previous and next months, each rendering that month's actual worked-out days.
- **FR-018**: Tapping a marked day on the History calendar MUST show that day's completed session(s) in detail, including cases where more than one session falls on the same day.
- **FR-019**: Session detail cards in History MUST render Date, Duration, and Effort rating in a larger type size than shipped in User Stories 1-4 of this spec.
- ~~"MUST NOT render a total-volume figure"~~: Superseded in Round 3 — see FR-020.
- **FR-020**: Session detail cards in History MUST render, in addition to Date/Duration/Effort: the number of distinct exercises performed, total volume lifted with the user's configured weight unit attached, resting time, and working time.
- **FR-021**: Resting time MUST be computed as the sum of elapsed time between consecutive logged sets within a session; working time MUST be the session's total duration minus resting time (never negative). Both MUST be computed from data already recorded (set timestamps, session start/end) — no new capture mechanism or schema change.

### Key Entities

- **Workout Session**: Gains a derived "duration" (computed from its existing `startedAt`/`endedAt`, no new column needed) and a new optional effort rating (1-5, nullable — new column, only set when the user chooses one, one rating per session).
- **Workout Streak**: A new, computed-not-stored concept — the count of immediately-consecutive calendar days (through today) with at least one completed session for the user, derived from existing completed-session history.
- **Session Timer (freeze point)**: A new, client-side-only concept — the moment the active session reaches "workout complete", captured once and reused both for the frozen on-screen display and as the persisted `endedAt` when the user finishes from that state.
- **History Calendar**: A new presentation of existing completed-session data — a month grid marking which calendar days have one or more completed sessions, replacing the flat list as History's primary view; selecting a day surfaces that day's session(s) using the existing per-session detail (larger type, plus the richer Round 3 stats below).
- **Session Breakdown (working vs. resting time)**: A new, computed-not-stored concept — for a given session, the gaps between consecutive logged sets' timestamps summed as "resting time," with the remainder of the session's total duration counted as "working time." Derived entirely from already-recorded set timestamps and session start/end; no new schema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user sees a large, live-counting timer at the top of the screen from the moment a session starts, which freezes exactly when the workout reaches "complete" and never resumes counting from that point.
- **SC-002**: Every session in history shows a duration that matches its actual recorded start and end time.
- **SC-003**: A user who works out on consecutive days sees their streak count increase by exactly one per new calendar day worked out, fully visible on the dashboard with no overflow/clipping at common device widths.
- **SC-004**: A user can rate a workout's effort in one tap on the finish screen, or skip rating entirely, and a single tap on "Finish workout" both saves the session and leaves the screen — no second screen or tap required either way.
- **SC-005**: All flows in this feature succeed with network access disabled.
- **SC-006**: Duration, streak, and rating data survive app restart and, for existing devices, schema migration without data loss.
- **SC-007**: A user can tap any day in the dashboard's weekly trend chart and see that day's actual sets/volume numbers.
- **SC-008**: A user with ~200 historical workouts can open History and, within two taps (open a month, tap a marked day), reach any specific past workout's detail without scrolling a long flat list.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than advanced training analytics.
- Features are local-only by default unless remote sync or accounts are explicitly requested and justified.
- "Total time" means wall-clock elapsed time from session start to session finish, computed from the already-existing `startedAt`/`endedAt` timestamps — no new stopwatch/pause mechanic is introduced (a backgrounded app does not pause the clock).
- Discarded sessions do not count toward duration history, streaks, or ratings — only completed sessions do, consistent with how history already excludes discarded sessions.
- Streak day-boundaries use the device's local calendar day at the time a session's `endedAt` was recorded; no timezone-travel reconciliation is introduced beyond what already exists.
- The effort rating is once per session, captured on the single finish screen — confirmed, not per individual exercise. "Smart suggestions based on the effort" are explicitly out of scope for this spec, per the user's own note — this spec only captures and displays the rating.
- Descoped from this pass: create-new-workout exercise search, and seed exercise images (the user will supply image files separately when ready — a future, image-only follow-up can wire them in without needing this spec reopened).
- The History calendar (User Story 6) uses a month-grid layout (navigate month by month), chosen over a continuous GitHub-style heatmap per explicit user preference, since it's more familiar and easier to jump to an exact date.
- The dashboard's "more interactive statistics" ask (User Story 5) is scoped to making the existing weekly trend chart tappable per the user's own choice; additional stat tiles and a longer time range (week/month/all-time) were explicitly declined for this pass and are not built.
- When a history calendar day has more than one completed session, all of that day's sessions are shown in the day's detail (not just the most recent) — multiple sessions per day are uncommon but not prevented elsewhere in the app, so the detail view must not silently drop any.
- "Volume in kg" (Round 3) is read as "attach the user's configured weight unit to the number," not as a hard requirement to convert everyone's data to kilograms — the app already supports `kg`/`lb` per user profile (`users.weight_unit`), and weights are stored as entered in that unit with no existing conversion logic anywhere in the app; the history card displays the user's actual configured unit rather than hardcoding "kg" specifically, so lb-configured profiles show correct units too.
- "Resting time" and "working time" (Round 3) are approximated from data already recorded, not from a new precise rest-timer capture mechanism: resting time is the sum of elapsed time between consecutive logged sets (a reasonable proxy for actual rest, consistent with how similar fitness-tracking apps compute this figure), and working time is whatever of the session's total duration isn't accounted for by those gaps. This works retroactively for every already-completed session, not just ones logged after this feature ships.
