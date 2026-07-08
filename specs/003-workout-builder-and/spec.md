# Feature Specification: Workout Builder and Session UX Refinements

**Feature Branch**: `003-workout-builder-and`

**Created**: 2026-07-08

**Status**: Delivered

**Input**: User description: "i want to have default sets and kg set in the workout for example if it says 10-12 reps just put 10 as default and let me change it if i want to add custom. also there are bodyweight so make weight optional -> if its bodyweight i dont need weight only reps. the next thing is make Start Session and Edit Workout buttons Bigger and visible. Also i can only click on the name of the workout - i want the whole bubble to be clickable so i can enter workout. if i copy to edit - i don't want to be able to start from there just edit. if i enter workout from workouts i can click to edit or start, but not start from edit mode. also i think i dont need rest to be attached to each exercise. and i want to be able to finish a workout at any time - even if no exercise is logged as completed - just start and finish. or complete all exercises and then finish. up / down in ordering exercises in edit can be done with icons. remove also. text on the splash screen shouldnt be white as the background is white and its not visible. also make the chart with history actual not static"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bodyweight Exercises Skip the Weight Field (Priority: P1)

A user logging a bodyweight exercise (e.g. Bodyweight Squat) enters only reps during an active session. The app does not require or prompt for a weight value.

**Why this priority**: This is on the core, most-used path in the app (logging a set) and removes a beginner-visible friction point every time a bodyweight exercise is logged. It is the smallest change with the highest repeat impact.

**Independent Test**: Start a session containing a bodyweight exercise, log a set with reps only, verify it saves without a weight validation error and displays correctly in history. Works fully offline.

**Acceptance Scenarios**:

1. **Given** the active exercise is bodyweight, **When** the user opens the set logger, **Then** the weight field is not shown (or is clearly marked optional and not required).
2. **Given** the active exercise is bodyweight, **When** the user submits reps with no weight, **Then** the set saves successfully.
3. **Given** the active exercise is not bodyweight, **When** the user opens the set logger, **Then** both reps and weight are required as today.
4. **Given** a bodyweight set was logged with no weight, **When** the user views exercise progress/history, **Then** volume and trend calculations handle the missing weight without showing incorrect or misleading numbers.

---

### User Story 2 - Finish a Workout at Any Time (Priority: P2)

A user can end an active session whenever they want — after logging every planned set, after logging none, or after logging only some — without the app blocking them.

**Why this priority**: Currently finishing a session is blocked unless at least one set is logged, which can trap a user who started a session by mistake or wants to stop early. This is a core session-flow fix with an easy, high-value test.

**Independent Test**: Start a session, immediately tap finish without logging any set, verify the session completes and appears correctly in history. Then repeat after logging a partial and a full set of exercises. Works fully offline.

**Acceptance Scenarios**:

1. **Given** an active session with zero logged sets, **When** the user taps finish, **Then** the session completes without error.
2. **Given** an active session with some but not all exercises logged, **When** the user taps finish, **Then** the session completes and only the logged sets appear in history.
3. **Given** an active session with every exercise fully logged, **When** the user taps finish, **Then** the session completes as today.

---

### User Story 3 - Single Default Rep Target, Customizable (Priority: P3)

When building or editing a workout, each exercise shows one target reps number by default (e.g. "10" instead of "10-12"), which the user can change. Sets also carry a sensible default the user can override.

**Why this priority**: Simplifies the builder's primary data-entry step, continuing work already started for the exercise picker. Depends on nothing else in this feature but is less frequently touched than logging or finishing a session.

**Independent Test**: Add an exercise to a workout, verify a single default reps value is pre-filled, change it to a custom value, save, and verify the custom value persists after reopening the workout. Works fully offline.

**Acceptance Scenarios**:

1. **Given** the user is adding an exercise to a workout, **When** the exercise card/row appears, **Then** target reps shows a single pre-filled default value rather than a range.
2. **Given** a default reps value is shown, **When** the user changes it, **Then** the custom value is used instead of the default.
3. **Given** a workout was saved with custom reps values, **When** the user reopens it to edit, **Then** the previously saved values are shown, not the defaults.
4. **Given** the user adds an exercise, **When** target sets is shown, **Then** it is pre-filled with a sensible default the user can also change.

---

### User Story 4 - One-Tap Workout Cards and Prominent Actions (Priority: P4)

On the Workouts list, tapping anywhere on a workout's card opens it — not just the name text. On a workout's detail screen, "Start Session" and "Edit Workout" are large, clearly visible actions.

**Why this priority**: Navigation ergonomics improvement on an already-working flow; valuable but not blocking any core action the way US1/US2 are.

**Independent Test**: From the Workouts list, tap anywhere on a workout card other than its name text and verify it opens the workout detail screen. On that screen, verify Start Session and Edit Workout are visually prominent (sized and styled as primary actions, not inline text links).

**Acceptance Scenarios**:

1. **Given** the Workouts list is showing a workout card, **When** the user taps anywhere on the card (not only the name), **Then** the workout detail screen opens.
2. **Given** the workout detail screen for a custom workout, **When** it renders, **Then** Start Session and Edit Workout are shown as large, clearly visible buttons.

---

### User Story 5 - Copying a Sample Workout Opens It for Editing Only (Priority: P5)

When a user copies a protected sample workout to customize it, they land directly in the edit/builder screen for the new copy — not on a detail screen that also offers "Start Session." Conversely, the edit/builder screen never offers a way to start a session directly from it.

**Why this priority**: Prevents accidentally starting a session on a workout the user only meant to customize first. Depends on the navigation entry points from US4 already being clear.

**Independent Test**: From a sample workout's detail screen, tap "Copy to edit," verify the app opens the edit screen for the new copy directly (no intermediate detail screen with a Start option). Verify the edit screen itself never shows a Start action.

**Acceptance Scenarios**:

1. **Given** a sample (template) workout's detail screen, **When** the user taps "Copy to edit," **Then** the app navigates directly into the edit screen for the newly created copy.
2. **Given** the user is on the edit screen for any custom workout, **When** the screen renders, **Then** no "Start Session" action is present.
3. **Given** the user opens a custom workout from the Workouts list (not via copy), **When** the detail screen renders, **Then** both Edit and Start actions are available, as in User Story 4.

---

### User Story 6 - Icon-Based Reorder and Remove Controls (Priority: P6)

In the workout editor, the "Up," "Down," and "Remove" text buttons on each exercise row are replaced with compact icon buttons.

**Why this priority**: Visual polish on an existing, already-functional control; no behavior change, lowest risk and lowest urgency.

**Independent Test**: Open the workout editor with two or more exercises, verify reordering and removing an exercise works via icon buttons with accessible labels equivalent to today's text buttons.

**Acceptance Scenarios**:

1. **Given** the workout editor shows an exercise row, **When** it renders, **Then** move-up, move-down, and remove are icon buttons instead of text buttons.
2. **Given** an icon button is used to reorder or remove an exercise, **When** the action is performed, **Then** the resulting behavior matches today's text-button behavior exactly (including disabled state at list boundaries).
3. **Given** a screen reader is active, **When** the user focuses an icon button, **Then** it announces an equivalent accessible label to the current text buttons ("Move up", "Move down", "Remove").

---

### User Story 7 - Remove Per-Exercise Rest Configuration (Priority: P7)

The workout builder no longer asks the user to set a rest duration for each individual exercise.

**Why this priority**: Simplifies the builder form; lowest priority because it removes a field rather than fixing a blocking or frequently-hit issue, and needs a decision on what (if anything) replaces per-exercise rest for the active-session rest timer.

**Independent Test**: Add or edit an exercise in the workout builder, verify no rest-duration input is shown, and verify the active session's rest timer still behaves sensibly (using a documented default) when a set is logged.

**Acceptance Scenarios**:

1. **Given** the user is adding or editing an exercise in the builder, **When** the exercise row renders, **Then** no per-exercise rest-duration field is shown.
2. **Given** a workout built without per-exercise rest values, **When** the user logs a set during an active session, **Then** the rest timer still starts using a sensible system default [NEEDS CLARIFICATION: should the rest timer be removed entirely, replaced with one workout-level rest value, or keep a fixed system default like 60s?].

---

### User Story 8 - Home Dashboard Reflects Real Data (Priority: P8)

The home screen's workout-trend chart, consistency stat, and any other summary figures are computed from the user's actual logged sessions instead of fixed placeholder values.

**Why this priority**: Currently misleading (shows the same fake numbers regardless of actual usage), but not blocking any workflow — purely a data-accuracy fix on a secondary screen.

**Independent Test**: Log workouts across a few different days, then verify the home screen's weekly volume chart reflects those sessions and updates as new sessions are completed. Verify the same for the consistency figure. Works fully offline.

**Acceptance Scenarios**:

1. **Given** the user has completed sessions this week, **When** they view the home screen, **Then** the weekly trend chart reflects actual completed-session volume per day, not a fixed dataset.
2. **Given** the user has no completed sessions yet, **When** they view the home screen, **Then** the chart and stats show an honest empty/zero state rather than fabricated numbers.
3. **Given** new sessions are completed, **When** the user returns to the home screen, **Then** the chart and stats reflect the update.

---

### User Story 9 - Splash Screen Text Is Legible (Priority: P9)

Any text shown during app startup is visible against its background (currently reported as white text on a white background).

**Why this priority**: Cosmetic bug, first-impression-only, no functional impact on any workflow.

**Independent Test**: Cold-start the app and verify all startup text is legible against its background in both light backgrounds.

**Acceptance Scenarios**:

1. **Given** the app is cold-starting, **When** any text renders during startup, **Then** it has sufficient contrast against its background to be read. [NEEDS CLARIFICATION: which specific screen shows white-on-white text — the native splash image, or a loading screen shown immediately after? Current splash image (assets/splash.png) has no text baked in, and the loading screen components already use dark text on light backgrounds, so the affected screen needs to be pinpointed, ideally with a screenshot.]

---

### Edge Cases

- What happens when a user marks a set as bodyweight-exercise reps-only, then the exercise's equipment/type is later edited to a weighted type? Existing logged sets should not become invalid.
- What happens if a user finishes a session with zero logged sets — does it still count toward workout history and dashboard stats, or is it distinguished from a "real" session?
- What happens when a workout being copied ("Copy to edit") has zero exercises — does the new edit screen still open normally?
- What happens if the user backgrounds the app while mid-reorder in the workout editor?
- What happens to already-saved workouts with existing rep ranges (low/high) or rest values when this feature ships — are they collapsed to a single default automatically, and how?
- What happens when local data was created with an older SQLite schema (rep range columns, rest column, weight NOT NULL) — the app must migrate forward without data loss or crashing, using an additive/incremental migration rather than editing the initial migration in place.
- What happens when the device is offline — all of the above must work identically offline since these are all local-only flows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The set logger MUST NOT require a weight value for exercises marked as bodyweight.
- **FR-002**: The set logger MUST continue to require both reps and weight for non-bodyweight exercises.
- **FR-003**: Volume and progress calculations MUST correctly handle sets logged without a weight value (no crash, no misleading zero-volume entries presented as real volume).
- **FR-004**: The system MUST allow a session to be finished (completed) regardless of how many sets have been logged, including zero.
- **FR-005**: The workout builder MUST show a single default target-reps value per exercise instead of a low/high range, while allowing the user to override it with a custom value.
- **FR-006**: The workout builder MUST pre-fill a sensible default target-sets value per exercise that the user can override.
- **FR-007**: Schema changes required for FR-005/FR-006 MUST be delivered as additive, incremental migrations that safely handle existing locally-stored workouts (no destructive rewrite of the initial migration).
- **FR-008**: The Workouts list MUST make each workout's entire card tappable to open it, not only the workout name text.
- **FR-009**: The workout detail screen MUST present "Start Session" and "Edit Workout" as visually prominent primary actions (not inline text links).
- **FR-010**: Copying a protected sample workout MUST navigate the user directly into the edit screen for the new copy, not to a detail screen offering "Start Session."
- **FR-011**: The workout edit/builder screen MUST NOT offer a "Start Session" action under any entry path.
- **FR-012**: Opening a custom workout from the Workouts list MUST continue to offer both Edit and Start actions.
- **FR-013**: The workout editor's move-up, move-down, and remove controls MUST be presented as icon buttons with accessible labels equivalent to the current text buttons, and MUST preserve current disabled-at-boundary behavior.
- **FR-014**: The workout builder MUST NOT collect a per-exercise rest duration.
- **FR-015**: The active session's rest timer behavior after removing per-exercise rest configuration MUST be explicitly defined (see US7 clarification) before implementation.
- **FR-016**: The home screen's workout-trend chart and summary stats MUST be computed from the user's actual local session data rather than fixed placeholder values, including an honest empty state when no sessions exist.
- **FR-017**: All screens shown during app startup MUST maintain sufficient text-to-background contrast to be legible.
- **FR-018**: All of the above MUST work fully offline, consistent with the existing offline-first behavior of the app.
- **FR-019**: Existing locally-stored workouts with rep ranges, rest values, and NOT NULL weight on set logs MUST continue to load and function after this feature ships (forward-safe migration, no data loss).

### Key Entities

- **WorkoutExercise**: Represents one exercise within a workout. Changes: `target_rep_range_low`/`target_rep_range_high` become a single `target_reps` value; `target_rest_seconds` is removed or becomes optional/system-defaulted (pending US7 clarification).
- **SetLog**: Represents one logged set within a session. Changes: `weight` becomes optional to support bodyweight exercises logged with reps only.
- **Exercise**: Existing entity; its `equipment`/bodyweight designation is the basis for whether the set logger requires weight (already present as data, used differently by this feature).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log a full bodyweight-only workout without ever being prompted for a weight value.
- **SC-002**: A user can start and immediately finish a session with zero logged sets in under 10 seconds, with no blocking error.
- **SC-003**: A user can add an exercise to a workout and accept the default reps/sets values with zero additional taps, or override them in one tap plus edit.
- **SC-004**: A user can open any workout from the Workouts list by tapping anywhere on its card.
- **SC-005**: A user who taps "Copy to edit" on a sample workout never sees a "Start Session" option until they have saved and reopened the copy from the Workouts list.
- **SC-006**: The home screen's weekly trend chart changes value after a new session is logged, within the same app session (no restart required).
- **SC-007**: All of the above are achievable with the device in airplane mode.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than advanced training analytics.
- Features are local-only by default; nothing in this feature requires network access or remote sync.
- "Bodyweight exercise" is determined by the existing `exercises.equipment` value (e.g. `"bodyweight"`) or `is_warmup`/equipment convention already present in the seed data; this feature does not introduce a new exercise classification field unless the plan phase determines the existing data is insufficient.
- "Default sets" (from the raw feature request) is interpreted as: target sets gets a pre-filled sensible default (matching current behavior of defaulting to a small number like 2-3) that remains user-editable, consistent with how target reps is being simplified — not a request for a separate unit-of-weight default, since the request's own example is entirely about reps.
- The exact replacement behavior for the active-session rest timer once per-exercise rest is removed (US7) is an open decision for the plan phase, flagged with [NEEDS CLARIFICATION] rather than assumed, since it affects an existing working feature (RestTimerControls).
- The exact screen responsible for the reported white-on-white splash text (US9) needs to be identified precisely (ideally via screenshot) before implementation, since the current splash image and loading-screen components already reviewed do not show this defect in code.
