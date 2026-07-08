# Feature Specification: Guided Session Flow, Default Set Values, and Favourite-Driven Dashboard

**Feature Branch**: `004-session-flow-and`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "1. rest timer should start when i log session -> start immediately predefined rest and i can skip with a single button if i want. 2. workout templates give me the opportunity to edit them to add exact reps and weight so i can just click - mark the set as completed and when competing the sets i put in the workout i edited it moves to the next exercise and dont wait me to click next. i want it to be flow -> complete set -> rest -> complete set -> rest / skip rest -> complete exercise - moves to next exercise 1st set -> complete set -> rest -> when i complete the last set of the last exercise -> complete the workout (i still have to be able to complete or stop at any time with buttons). 3. if i mark workout as favourite i want it to pop on my dashboard replacing the basic 3 workouts. the 3 templates should be able to be started with some default values for reps and weight. 4. the reps input is too large for free body exercises - make it the same as for the other."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rest Timer Starts Automatically, Skippable in One Tap (Priority: P1)

A user logs a set during an active session. The rest timer for that exercise starts immediately, with no separate "start rest" step, and counts down using the exercise's rest duration. The user can skip the remaining rest at any moment with a single button.

**Why this priority**: Removes an extra manual step on the single most-repeated action in the app (logging a set), and is a prerequisite for the guided flow in User Story 2.

**Independent Test**: Start a session, log a set, verify the rest countdown begins without further input, then verify a single tap on "Skip rest" ends the countdown immediately. Works fully offline.

**Acceptance Scenarios**:

1. **Given** an active session on an exercise's set, **When** the user marks the set complete, **Then** the rest countdown starts immediately using that exercise's rest duration, with no extra action required.
2. **Given** an active rest countdown, **When** the user taps "Skip rest", **Then** the countdown ends immediately and the session is ready for the next set.

---

### User Story 2 - Session Auto-Advances Through Sets and Exercises (Priority: P1)

A user logging a workout is guided through the full session without needing to manually advance between sets or exercises. Completing a set (and its rest, or skipping it) moves straight to the next set; completing the last set of an exercise moves straight to the first set of the next exercise. The user can still finish or discard the workout at any time using explicit buttons.

**Why this priority**: This is the core of the "flow" experience the user described — it's what makes logging feel continuous rather than a series of manual taps between every set, and it's independently valuable even before default values (User Story 3) exist.

**Independent Test**: Start a session with 2+ exercises and 2+ sets each. Log every set without pressing anything except "Complete set" and, optionally, "Skip rest". Verify the app lands on the next set or next exercise automatically each time, and verify "Finish workout" / "Discard" remain available and functional at every point in that sequence.

**Acceptance Scenarios**:

1. **Given** a set that is not the last set of its exercise, **When** the user completes it and rest ends (elapses or is skipped), **Then** the session advances to the next set of the same exercise automatically.
2. **Given** the last set of an exercise that is not the last exercise, **When** the user completes it and rest ends, **Then** the session advances to the first set of the next exercise automatically.
3. **Given** the last set of the last exercise in the workout, **When** the user completes it, **Then** the app clearly surfaces the "Complete workout" action as the next step. [NEEDS CLARIFICATION: should completing the final set auto-finish the workout immediately, or stop and wait for an explicit "Finish workout" tap?]
4. **Given** a session in progress at any point in the sequence, **When** the user taps "Finish workout" or "Discard", **Then** the session ends immediately regardless of remaining sets or exercises.

---

### User Story 3 - Default Reps and Weight for One-Tap Set Completion (Priority: P2)

A user editing a workout (their own custom workout, or a copy of a sample workout) can set an exact default reps value and, for weighted exercises, a default weight, per exercise. During a session, each set is prefilled with those defaults, so the user can log a set with a single tap and only edit the value when it actually changes. The three built-in sample workouts ship with sensible non-empty defaults so they can be started and logged immediately, without requiring the user to edit them first.

**Why this priority**: Builds on User Stories 1-2 to make the guided flow genuinely one-tap; without defaults, "auto-advance" still requires typing reps/weight on every set.

**Independent Test**: Edit a custom workout, set default reps (and weight, for a weighted exercise) on an exercise, start a session, and confirm the set log form is pre-filled with those defaults and can be completed with a single tap. Separately, start one of the three sample workouts without editing it and confirm its sets are already pre-filled with non-empty defaults. Works fully offline.

**Acceptance Scenarios**:

1. **Given** a workout exercise with a default reps value set in the builder, **When** the user opens that set during a session, **Then** the reps field is pre-filled with that default.
2. **Given** a non-bodyweight workout exercise with a default weight value set, **When** the user opens that set during a session, **Then** the weight field is pre-filled with that default.
3. **Given** a pre-filled set, **When** the user taps "Complete set" without changing anything, **Then** the set logs successfully using the pre-filled values.
4. **Given** a pre-filled set, **When** the user edits the reps or weight before completing, **Then** the edited value is what gets logged, not the default.
5. **Given** one of the three built-in sample workouts, **When** the user starts a session from it without editing it first, **Then** every set already has a usable non-empty reps default (and weight default, where applicable).

---

### User Story 4 - Favourited Workouts Replace Dashboard Suggestions (Priority: P3)

A user marks a workout as a favourite. The home dashboard's suggested-workouts area shows that favourite instead of (or ahead of) the app's default suggestion picks, so the workouts the user actually cares about are what they see first.

**Why this priority**: A visible, motivating payoff for using the favourite feature, but it's a dashboard presentation change that doesn't block core logging and can land after the session-flow work.

**Independent Test**: Favourite a workout that would not otherwise appear in the default suggestions, return to the dashboard, and confirm it now appears in the suggested-workouts area in place of a previously-shown default suggestion. Works fully offline.

**Acceptance Scenarios**:

1. **Given** no favourited workouts, **When** the user views the dashboard, **Then** the suggested-workouts area shows the existing default recommendation logic (unchanged behavior).
2. **Given** one or more favourited workouts, **When** the user views the dashboard, **Then** favourited workouts appear in the suggested-workouts area, taking priority over the default picks. [NEEDS CLARIFICATION: with more favourites than suggestion slots, do favourites fully replace all default picks, and in what order (e.g. most recently favourited first)?]
3. **Given** a favourited workout shown on the dashboard, **When** the user un-favourites it, **Then** it is removed from the suggested-workouts area on the next view and the default picks resume filling the freed slot(s).

---

### User Story 5 - Bodyweight Reps Input Matches Standard Input Sizing (Priority: P4)

A user logging a bodyweight exercise sees a reps input field that is the same size as the reps/weight inputs used for other exercises, instead of an oversized field that stands out inconsistently.

**Why this priority**: Small, isolated visual-consistency fix with no data or flow implications; lowest risk and effort in this batch.

**Independent Test**: Open the set log editor for a bodyweight exercise and a non-bodyweight exercise side by side (or in sequence) and confirm the reps input renders at the same size/style in both.

**Acceptance Scenarios**:

1. **Given** the set log editor for a bodyweight exercise, **When** it renders, **Then** the reps input uses the same field size/style as the reps input for non-bodyweight exercises.

---

### Edge Cases

- What happens if the user backgrounds the app (or the device locks) while a rest countdown is running? The countdown should not desync from real elapsed time when the app resumes.
- What happens if the user taps "Skip rest" during the very last rest period (after the final set)? The workout should still land on the "complete workout" step, not error.
- What happens when a workout exercise has no default reps/weight configured (e.g., an older custom workout created before this feature)? The set log editor should fall back to an empty/manual-entry field exactly as it does today, not block logging.
- What happens if the user edits default reps/weight on a workout mid-session (in another screen/tab)? The active session should not silently change already-logged sets; only future sets in that session pick up new defaults, and only after a fresh load.
- What happens when the user un-favourites the only favourite currently shown on the dashboard while offline? The dashboard should fall back to default suggestions without error.
- What happens when the device is offline or in airplane mode? All flows in this feature (rest timer, auto-advance, defaults, favourites-on-dashboard) MUST work fully offline, matching the rest of the app.
- What happens after the app is closed and reopened mid-session? The current set/exercise position and any running rest countdown should resume consistently with existing active-session persistence behavior.
- What happens when local data (workout_exercises) was created with an older SQLite schema that has no default reps/weight columns? Existing rows must self-heal or default safely to "no default set" rather than crashing, consistent with this project's established self-healing migration pattern.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The rest timer MUST start automatically immediately after a set is marked complete, using that exercise's configured rest duration, with no separate manual "start rest" action.
- **FR-002**: Users MUST be able to end the active rest countdown at any time via a single "Skip rest" tap.
- **FR-003**: When a completed set is not the last set of its exercise, the session MUST advance to the next set of that exercise automatically once rest ends (elapses or is skipped), without a manual "next set" action.
- **FR-004**: When a completed set is the last set of an exercise that is not the last exercise in the workout, the session MUST advance to the first set of the next exercise automatically once rest ends, without a manual "next exercise" action.
- **FR-005**: Users MUST be able to finish or discard the workout at any point in the session regardless of how many sets or exercises remain, via explicit, always-available controls.
- **FR-006**: When the last set of the last exercise is completed, the app MUST make completing the workout the immediate next step for the user. [NEEDS CLARIFICATION: automatic completion vs. a single explicit confirm tap — see User Story 2, Acceptance Scenario 3]
- **FR-007**: Workout exercises MUST support an editable default reps value, settable in the workout builder (for both new custom workouts and edited copies of sample workouts).
- **FR-008**: Workout exercises for non-bodyweight equipment MUST support an editable default weight value, settable in the workout builder.
- **FR-009**: During a session, the set log form MUST pre-fill reps (and weight, where applicable) from the workout exercise's default values when they are set.
- **FR-010**: Users MUST be able to complete a pre-filled set with a single tap without re-entering values, and MUST still be able to edit the pre-filled values before completing if the actual performance differs.
- **FR-011**: The three built-in sample workouts MUST ship with non-empty default reps (and weight, where applicable) values so a session can be started and fully logged without first editing the workout.
- **FR-012**: Marking a workout as a favourite MUST cause it to be included in the dashboard's suggested-workouts area on subsequent views.
- **FR-013**: Un-favouriting a workout MUST remove it from the dashboard's suggested-workouts area on subsequent views, with default suggestion picks resuming to fill any freed slot.
- **FR-014**: The reps input field in the set log editor MUST use the same visual sizing/style for bodyweight exercises as it does for non-bodyweight exercises.
- **FR-015**: All flows introduced by this feature (rest timer auto-start/skip, auto-advance, default-value prefill, favourites-driven dashboard) MUST function fully offline.
- **FR-016**: Existing local databases without default reps/weight columns MUST self-heal to the new schema without data loss, consistent with this project's established migration pattern (verified against a simulated pre-existing/drifted device, not just a fresh install).

### Key Entities

- **Workout Exercise**: Gains an optional default reps value and (for non-bodyweight equipment) an optional default weight value, used to prefill set logging during a session.
- **Active Session Set**: The in-progress set a user is logging; now carries pre-filled reps/weight sourced from its workout exercise's defaults when present.
- **Rest Timer**: The per-exercise countdown; now starts automatically on set completion instead of waiting for a manual trigger, and remains user-skippable.
- **Favourite Workout**: An existing flag on a workout; gains a new consumer — the dashboard's suggested-workouts selection logic now factors it in.
- **Dashboard Suggested Workouts**: The list currently produced by the default recommendation logic; must now incorporate favourited workouts ahead of (or instead of) default picks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete an entire multi-exercise, multi-set workout by only tapping "Complete set" and, optionally, "Skip rest" — with zero manual "next set" or "next exercise" taps required.
- **SC-002**: A user can start any of the three sample workouts and log every set using only its shipped defaults, with no required edits beforehand.
- **SC-003**: A user can end a workout at any point in the sequence described above with a single explicit tap, at every step from the first set to the last.
- **SC-004**: Favouriting a workout makes it visible in the dashboard's suggested-workouts area on the very next dashboard view, with no app restart required.
- **SC-005**: All flows in this feature succeed with network access disabled.
- **SC-006**: Logging data and default values survive app restart and, for existing devices, schema migration without data loss.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than advanced training analytics.
- Features are local-only by default unless remote sync or accounts are explicitly requested and justified.
- "Templates" in the user's request refers to the existing sample-workout and custom-workout builder flow already in place (edit a custom workout, or copy a sample workout to edit): this feature does not introduce direct in-place editing of the shared, unowned sample workout rows themselves.
- "Predefined rest" reuses the existing per-exercise rest duration mechanism already in the app; this feature does not introduce a new configuration surface for rest duration itself, only when the countdown starts.
- Default reps/weight are optional per exercise; workouts created before this feature (or exercises left unedited) continue to use manual entry exactly as today.
- The dashboard's "3 basic workouts" refers to the existing suggested-workouts area (currently populated by `workoutRecommendationService`), not the separate Sample/Custom workout list screen.
