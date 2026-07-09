# Feature Specification: Guided Session Flow, Default Set Values, and Favourite-Driven Dashboard

**Feature Branch**: `004-session-flow-and`

**Created**: 2026-07-08

**Status**: Delivered

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
4. **Given** the user favourites a workout on the Workouts screen and navigates back to the dashboard (not a fresh app launch), **When** the dashboard screen regains focus, **Then** it re-checks favourites and shows the update immediately. **Found during validation**: the dashboard's suggestion logic itself was already correct, but the screen only loaded suggestions once on first mount and never refreshed on returning to it — so a freshly-favourited workout did not appear until a full app restart. This scenario closes that gap explicitly.

---

### User Story 5 - Bodyweight Reps Input Matches Standard Input Sizing (Priority: P4)

A user logging a bodyweight exercise sees a reps input field that is the same size as the reps/weight inputs used for other exercises, instead of an oversized field that stands out inconsistently.

**Why this priority**: Small, isolated visual-consistency fix with no data or flow implications; lowest risk and effort in this batch.

**Independent Test**: Open the set log editor for a bodyweight exercise and a non-bodyweight exercise side by side (or in sequence) and confirm the reps input renders at the same size/style in both.

**Acceptance Scenarios**:

1. **Given** the set log editor for a bodyweight exercise, **When** it renders, **Then** the reps input uses the same field size/style as the reps input for non-bodyweight exercises.

---

### User Story 6 - Per-Set Reps and Weight Targets (Priority: P2)

A user planning a workout can give each set of an exercise its own target reps and weight — e.g. one set at 10 reps/15kg and another at 12 reps/12kg — instead of every set being forced to share one value. For the common case where every set is the same, the user can still set it once (a "uniform" shortcut: sets count + one reps/weight value) and have it apply to every set, rather than repeating themselves per set.

**Why this priority**: Extends User Story 3's one-tap defaults to match how people actually train (ramping or drop sets, not just straight sets), without adding friction for the common uniform case that User Story 3 already covers.

**Independent Test**: In the builder, plan an exercise with 2 sets that differ — set 1: 10 reps/15kg, set 2: 12 reps/12kg. Start a session and confirm set 1's log form pre-fills 10/15 and set 2's pre-fills 12/12, in order, and that the resulting history shows two sets with those distinct values. Separately, confirm the uniform shortcut still works for an exercise where every set is the same.

**Acceptance Scenarios**:

1. **Given** an exercise with no planned sets yet, **When** the user adds sets one at a time with different reps/weight per set, **Then** each set's values are stored and shown individually.
2. **Given** an exercise where the user wants the same reps/weight for every set, **When** the user enters a sets count plus one reps/weight value, **Then** every set in that exercise is planned with that same value (today's single-default entry, kept as a shortcut, not removed).
3. **Given** a workout exercise with a per-set plan, **When** a session reaches set N of that exercise, **Then** the set log form pre-fills with set N's specific planned reps and weight, not a single exercise-wide default.
4. **Given** a per-set plan with differing values, **When** the user views logged history for that session, **Then** the logged sets show their own distinct reps/weight values (an edited-before-completing value still wins over the plan, per User Story 3, Acceptance Scenario 4).
5. **Given** an existing workout created before this feature (single default reps/weight only), **When** the user opens it in the builder or starts a session, **Then** it behaves exactly as before — as if every set uses that one value — with no data loss or forced re-entry.

---

### User Story 7 - Superset Grouping Removed (Priority: P5)

A user building a workout no longer sees a "superset" toggle or grouping control on exercises. Every exercise in the builder is planned and logged independently.

**Why this priority**: Pure simplification the user explicitly asked for ("i don't need to mark as superset"); nothing else depends on it, and it's the lowest-risk, lowest-urgency item in this batch.

**Independent Test**: Open the workout builder and confirm no superset toggle or grouping indicator appears anywhere on an exercise card, for both new and pre-existing workouts.

**Acceptance Scenarios**:

1. **Given** the workout builder, **When** the user views any exercise card, **Then** no superset control is present.
2. **Given** a workout that was previously saved with exercises grouped into a superset, **When** the user opens it now, **Then** it opens, edits, and saves normally with no superset grouping shown or enforced.

---

### User Story 8 - Exercise Search Works When Adding Exercises to a Workout (Priority: P1)

A user editing an existing workout types into the "Search exercises" field and the exercise list below filters to match, instead of always showing the same unfiltered list no matter what's typed.

**Why this priority**: **Found during validation**: the search field is rendered but was never wired to any state — it accepts typing but does nothing. A visibly present, completely non-functional control on a core editing path (adding an exercise to an existing workout) is a P1-level defect, not polish.

**Independent Test**: Open an existing workout for editing, type a partial exercise name into the search field, and confirm the list below updates to only matching exercises (case-insensitive), returning to the default list when the search is cleared.

**Acceptance Scenarios**:

1. **Given** the "Add exercises" search field in the workout builder (edit mode), **When** the user types text, **Then** the exercise list below filters to exercises whose name contains that text (case-insensitive).
2. **Given** a search that matches no exercise, **When** the user views the list, **Then** an honest "no matches" state is shown instead of an empty or stale unfiltered list.
3. **Given** text typed into the search field, **When** the user clears it, **Then** the list returns to its default (already-existing) unfiltered behavior.

---

### User Story 9 - Workout History Is Reachable and Reflects Finished Sessions (Priority: P1)

A user finishes a workout and can then find a screen showing their session history, with that session reflected in it — instead of the app's "Progress" navigation leading nowhere useful.

**Why this priority**: **Found during validation**: the bottom-nav "Progress" entry point routes to a hardcoded placeholder exercise ID (`/progress/placeholder`) that was never wired to a real exercise, and the only progress screen that exists requires a specific exercise to already be chosen — there is no session-list-first view at all. Finishing a workout therefore appears to have no visible effect. This is a P1 defect: history is core, expected functionality, not an enhancement.

**Independent Test**: Finish a workout with at least one logged set, navigate to the app's history/progress entry point, and confirm the just-completed session appears without needing to already know which specific exercise to look up.

**Acceptance Scenarios**:

1. **Given** at least one completed session, **When** the user opens the app's history entry point (the bottom-nav "Progress" tab), **Then** they see a real list of completed sessions (not a per-exercise-only screen requiring a specific exercise first), most recent first.
2. **Given** a workout the user just finished, **When** they open history immediately afterward, **Then** that session appears without needing to restart the app.
3. **Given** no completed sessions yet, **When** the user opens history, **Then** an honest empty state is shown rather than an error or blank screen.
4. **Given** a session in the history list, **When** the user wants more detail on one exercise, **Then** they can still reach the existing per-exercise progress charts (User Story 9 adds a list-first entry point; it does not remove the existing per-exercise detail view).

---

### User Story 10 - Finish and Discard Session Share One Row (Priority: P5)

A user viewing the active session's "Finish session" and "Discard session" controls sees them side by side on one row, each taking half the width, instead of stacked as two full-width rows.

**Why this priority**: Small, isolated layout change with no data or flow implications.

**Independent Test**: Open an active session and confirm "Finish session" and "Discard session" render next to each other on a single row, each roughly half-width.

**Acceptance Scenarios**:

1. **Given** an active session (mid-workout or at the workout-complete state), **When** the finish/discard controls render, **Then** they appear side by side on one row, each occupying half the available width.

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
- What happens when a workout exercise already has logged sets and its plan (per-set reps/weight, or the exercise list itself) is edited and re-saved? The save must not fail or delete history — this project already hit and fixed a real incident here (re-saving a workout with logged sessions against it threw a foreign-key error because saving used to delete-and-recreate every row); any per-set-plan storage introduced by User Story 6 MUST follow the same "never delete a row logged history still points to" rule.
- What happens to a per-set plan when the user removes a set that already has a logged history entry mid-session? The plan is what's used for future prefills only; already-logged sets are never altered retroactively (existing rule, restated for per-set plans).
- What happens when the exercise search text matches an exercise that's already been added to the workout? It stays excluded from the addable list, consistent with today's dedupe-by-selected-exercise behavior.
- What happens when the user favourites a workout, backgrounds the app, and returns without it being killed? The dashboard should still reflect the change on next view of that screen, the same as returning via in-app navigation.

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
- **FR-017**: The workout builder MUST let a user assign an individual reps and weight target to each planned set of an exercise, not only one value shared by every set.
- **FR-018**: The workout builder MUST offer a "uniform" shortcut that applies one reps/weight value to every set of an exercise in a single entry, for the common case where all sets are the same.
- **FR-019**: During a session, each set's log form MUST pre-fill from that specific set's planned reps/weight (per FR-017/018), not a single exercise-wide default.
- **FR-020**: Existing workouts created before per-set targets existed MUST continue to behave exactly as before (as if every set shares the one existing default value), without data loss or requiring the user to re-enter anything.
- **FR-021**: Saving changes to a workout's exercises or per-set plan MUST NOT fail, and MUST NOT delete or orphan history, when the workout has one or more logged sessions against it.
- **FR-022**: The workout builder MUST NOT present any superset/grouping control; existing superset data on already-saved workouts MUST NOT block normal opening, editing, or saving of those workouts.
- **FR-023**: The "Search exercises" field in the workout builder's add-exercise list MUST filter the displayed exercises by the typed text (case-insensitive substring match against exercise name).
- **FR-024**: The app MUST provide a reachable history entry point that lists completed sessions directly, without requiring the user to already know a specific exercise.
- **FR-025**: A session's completion MUST be visible in the history entry point on the very next view of that screen, without requiring an app restart.
- **FR-026**: The dashboard's suggested-workouts area MUST reflect the current favourite state every time the dashboard screen regains focus (e.g. navigating back to it), not only on the app's initial load.
- **FR-027**: The "Finish session" and "Discard session" controls MUST be laid out side by side on a single row, each taking half the available width, rather than stacked as two full-width rows.

### Key Entities

- **Workout Exercise**: Gains an optional default reps value and (for non-bodyweight equipment) an optional default weight value, used to prefill set logging during a session.
- **Active Session Set**: The in-progress set a user is logging; now carries pre-filled reps/weight sourced from its workout exercise's defaults when present.
- **Rest Timer**: The per-exercise countdown; now starts automatically on set completion instead of waiting for a manual trigger, and remains user-skippable.
- **Favourite Workout**: An existing flag on a workout; gains a new consumer — the dashboard's suggested-workouts selection logic now factors it in.
- **Dashboard Suggested Workouts**: The list currently produced by the default recommendation logic; must now incorporate favourited workouts ahead of (or instead of) default picks, and must refresh on every dashboard focus, not only app launch.
- **Planned Set**: A new concept — one row of an exercise's plan (set number, reps, weight), replacing "one default for the whole exercise" as the source of truth for session prefill; a uniform plan is just N planned sets carrying identical values.
- **Session History (list view)**: A new concept — an ordered list of completed sessions, the entry point the bottom-nav "Progress" tab should actually lead to, distinct from (and linking into) the existing per-exercise progress detail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete an entire multi-exercise, multi-set workout by only tapping "Complete set" and, optionally, "Skip rest" — with zero manual "next set" or "next exercise" taps required.
- **SC-002**: A user can start any of the three sample workouts and log every set using only its shipped defaults, with no required edits beforehand.
- **SC-003**: A user can end a workout at any point in the sequence described above with a single explicit tap, at every step from the first set to the last.
- **SC-004**: Favouriting a workout makes it visible in the dashboard's suggested-workouts area on the very next dashboard view, with no app restart required.
- **SC-005**: All flows in this feature succeed with network access disabled.
- **SC-006**: Logging data and default values survive app restart and, for existing devices, schema migration without data loss.
- **SC-007**: A user can plan an exercise with different reps/weight per set and see those exact values reflected when logging each set in a session.
- **SC-008**: Typing into the exercise search field narrows the addable list to matching exercises within the same screen, with no navigation required.
- **SC-009**: A finished session is visible in the app's history entry point on the very next view of that screen, with no app restart required.
- **SC-010**: Favouriting or un-favouriting a workout is reflected on the dashboard the next time the dashboard screen is viewed, including returning to it via back-navigation, not only via a fresh app launch.
- **SC-011**: Saving a workout that has one or more logged sessions against it succeeds without error and without altering already-logged history.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than advanced training analytics.
- Features are local-only by default unless remote sync or accounts are explicitly requested and justified.
- "Templates" in the user's request refers to the existing sample-workout and custom-workout builder flow already in place (edit a custom workout, or copy a sample workout to edit): this feature does not introduce direct in-place editing of the shared, unowned sample workout rows themselves.
- "Predefined rest" reuses the existing per-exercise rest duration mechanism already in the app; this feature does not introduce a new configuration surface for rest duration itself, only when the countdown starts.
- Default reps/weight are optional per exercise; workouts created before this feature (or exercises left unedited) continue to use manual entry exactly as today.
- The dashboard's "3 basic workouts" refers to the existing suggested-workouts area (currently populated by `workoutRecommendationService`), not the separate Sample/Custom workout list screen.
- "History" (User Story 9) refers to a session-list-first view (most recent completed sessions), not only the existing per-exercise progress charts — those remain reachable from within history/an exercise detail, they are not replaced.
- Superset removal (User Story 7) is a UI/feature removal only; the underlying `superset_group_id` column is not necessarily dropped in this pass, avoiding an unnecessary migration for a field that simply goes unused, consistent with this project's standing preference to avoid schema risk not required by the actual requirement.
- "Combined... in the history" (per-set plan, User Story 6) means each planned set logs as its own independent history row with its own reps/weight, exactly like today's set logging — no new aggregation concept is introduced, only the source of the prefill values changes from one-per-exercise to one-per-set.
