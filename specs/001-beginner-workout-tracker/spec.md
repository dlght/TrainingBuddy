# Feature Specification: Beginner Workout Tracker

**Feature Branch**: `001-beginner-workout-tracker`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "A simple mobile app where a beginner logs workouts (sets, reps, weight, effort/RPE) against a personal profile, using a pre-seeded exercise library with images, and can build custom workouts. Core user stories: create a profile; browse an exercise library grouped by muscle group with pictures, short instructions, and warmup flag; create workouts by picking exercises and target sets/reps/rest; start a workout session and log actual reps/weight/effort with rest timer; view history/progress per exercise; first launch includes 3 sample workouts with exercises and images. Non-goals for v1: social features, nutrition tracking, wearable sync, offline-first sync across devices."

## Clarifications

### Session 2026-07-05

- Q: Which weight unit behavior should v1 support? -> A: User chooses kg or lb during profile setup.
- Q: Which personal record metrics should v1 track? -> A: Do not track highest weight or one-rep max; show full session history with reps and weight.
- Q: How large should the v1 exercise library be? -> A: Only exercises needed by the 3 sample workouts.
- Q: What should happen to history when workout or exercise details change? -> A: Completed sessions keep their original performed details.
- Q: How should users customize sample workouts? -> A: Users copy sample workouts before editing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete First-Launch Setup (Priority: P1)

A new beginner opens the app for the first time, creates a simple personal
profile, and sees starter workouts and exercises immediately instead of an empty
state.

**Why this priority**: The app cannot feel useful or personal until the user can
identify themselves and see beginner-ready content.

**Independent Test**: Install the app with no prior data, create a profile with
name, bodyweight, experience level, and goals, then confirm that three sample
workouts and exercise images are available without network access.

**Acceptance Scenarios**:

1. **Given** a first-time user with no saved profile, **When** they enter a name, bodyweight, weight unit, experience level, and at least one goal, **Then** the app saves the profile and shows the main workout experience.
2. **Given** first launch is complete, **When** the user views available workouts, **Then** they see three preloaded sample workouts with named exercises and images.
3. **Given** the device has no network connection, **When** the user reopens the app after setup, **Then** their profile and sample workouts are still available.

---

### User Story 2 - Browse Beginner Exercise Library (Priority: P2)

A user browses a preloaded exercise library grouped by muscle group and opens an
exercise to see a picture, short instructions, and whether it is suitable as a
warmup.

**Why this priority**: Beginners need guidance before they can confidently build
or follow a workout.

**Independent Test**: Browse the exercise library by muscle group, open several
exercise details, and verify each detail view includes an image, concise
instructions, and a warmup indicator.

**Acceptance Scenarios**:

1. **Given** the user is viewing the exercise library, **When** they choose a muscle group, **Then** the app shows exercises assigned to that group.
2. **Given** an exercise appears in the library, **When** the user opens it, **Then** they see a picture, short instructions, primary muscle group, and warmup status.
3. **Given** an exercise is marked as warmup-friendly, **When** it appears in a list or detail view, **Then** the user can recognize that warmup status without reading long instructions.

---

### User Story 3 - Build a Custom Workout (Priority: P3)

A user creates a custom workout by selecting exercises from the library and
setting target sets, target reps, and rest time for each exercise.

**Why this priority**: Custom workouts let beginners turn the exercise library
into a repeatable routine that matches their goals.

**Independent Test**: Create a workout from at least three exercises, set target
sets, reps, and rest times, save it, close and reopen the app, then confirm the
workout remains editable and startable.

**Acceptance Scenarios**:

1. **Given** the user is creating a workout, **When** they add exercises from the library, **Then** the selected exercises appear in the workout in the chosen order.
2. **Given** an exercise is in a custom workout, **When** the user sets target sets, reps, and rest time, **Then** those targets are saved with that workout exercise.
3. **Given** a saved custom workout exists, **When** the user reopens the app, **Then** the workout is still available with its exercises and targets.

---

### User Story 4 - Log a Workout Session (Priority: P4)

A user starts a saved workout, records actual reps, weight, and effort level for
each set, and uses a rest timer between sets.

**Why this priority**: Logging real training is the core recurring behavior of
the app.

**Independent Test**: Start a sample or custom workout, log multiple sets with
actual reps, weight, and effort from 1 to 10, use the rest timer after a set,
finish the workout, and verify the completed session appears in history.

**Acceptance Scenarios**:

1. **Given** a workout exists, **When** the user starts it, **Then** the app creates an active session with the workout's exercises and targets.
2. **Given** the user is logging a set, **When** they enter actual reps, weight, and effort from 1 to 10, **Then** the set is saved in the active session.
3. **Given** a set is completed and the exercise has a rest target, **When** the user starts rest, **Then** a countdown timer is visible and can complete without leaving the session.
4. **Given** the user finishes all desired sets, **When** they end the session, **Then** the app saves the session to workout history.

---

### User Story 5 - Review Exercise History (Priority: P5)

A user reviews progress for an exercise, including weight over time, total
volume, and the full set history from previous sessions.

**Why this priority**: Simple progress feedback helps beginners see consistency
and improvement without advanced analytics.

**Independent Test**: Complete at least two sessions containing the same
exercise, open that exercise's history view, and verify that each relevant
session shows the logged reps and weight for its sets.

**Acceptance Scenarios**:

1. **Given** the user has logged sets for an exercise across sessions, **When** they open that exercise's history, **Then** they see previous dates, reps, weight, effort values, and the performed exercise details saved at completion time.
2. **Given** exercise history exists, **When** the user views progress, **Then** the app shows weight over time and total training volume for that exercise.
3. **Given** multiple sessions include the same exercise, **When** the user views that exercise's history, **Then** the app shows each session's logged sets with reps and weight.

---

### User Story 6 - Use Preloaded Sample Workouts (Priority: P6)

A first-time user chooses one of three preloaded sample workouts, such as Full
Body A, Full Body B, or Full Body C, and can start it without creating a custom
routine first.

**Why this priority**: Starter workouts prevent blank-page friction and give
beginners an immediate path to logging.

**Independent Test**: Launch the app as a new user, select each sample workout,
confirm it contains exercises with images and targets, and start one as a
workout session.

**Acceptance Scenarios**:

1. **Given** the app has been opened for the first time, **When** the user views workouts, **Then** three sample workouts are listed.
2. **Given** a sample workout is opened, **When** the user reviews its contents, **Then** it includes exercise names, images, and beginner-appropriate targets.
3. **Given** a sample workout exists, **When** the user starts it, **Then** it behaves like any other workout session.
4. **Given** the user wants to customize a sample workout, **When** they choose to edit it, **Then** the app creates an editable copy and leaves the original sample workout unchanged.

### Edge Cases

- Profile setup is abandoned before completion; the app preserves completed fields where appropriate and keeps setup resumable.
- Bodyweight, reps, weight, sets, rest, or effort values are missing, zero, negative, or outside allowed ranges.
- A workout is saved with no exercises; the app prevents starting it and explains what to add.
- A selected exercise image is unavailable; the app still shows the exercise name, instructions, and a clear placeholder.
- The device is offline or in airplane mode during first launch, workout creation, session logging, and history review.
- The app is closed during an active workout session; the user can resume or intentionally discard the unfinished session.
- The rest timer is interrupted by the app going to the background; the remaining or elapsed rest time is understandable when the app returns.
- Historical data exists for an exercise or workout that has since been edited; past session records keep the original performed details and remain readable.
- A sample workout has been copied and customized by the user; future app launches keep both the original sample workout and the user's customized copy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST allow a user to create and edit one personal profile containing name, bodyweight, weight unit, experience level, and one or more goals.
- **FR-002**: The app MUST make the user's profile available across app restarts on the same device.
- **FR-002a**: The app MUST allow the user to choose either kilograms or pounds during profile setup and use that unit consistently for bodyweight, logged workout weights, and progress displays.
- **FR-003**: The app MUST include a preloaded exercise library grouped by muscle group and limited in v1 to the exercises needed by the three sample workouts.
- **FR-004**: Each exercise MUST include a name, at least one muscle group, a picture or placeholder, short beginner-readable instructions, and a warmup indicator.
- **FR-005**: The app MUST allow users to browse exercises by muscle group and open exercise detail views.
- **FR-006**: The app MUST include three preloaded sample workouts on first launch.
- **FR-007**: Each sample workout MUST contain named exercises from the library, beginner-appropriate targets, and exercise images or placeholders.
- **FR-007a**: The app MUST keep preloaded sample workouts unchanged; users who want to customize one MUST do so by creating an editable copy.
- **FR-008**: The app MUST allow users to create, edit, rename, and delete custom workouts.
- **FR-009**: The app MUST allow users to add exercises from the library to a custom workout.
- **FR-010**: For each exercise in a workout, the app MUST allow users to set target sets, target reps, and target rest duration.
- **FR-011**: The app MUST allow users to start a workout session from a sample or custom workout.
- **FR-012**: During a session, the app MUST allow users to log actual reps, weight, and effort for each set.
- **FR-013**: Effort MUST be recorded on a 1 to 10 scale.
- **FR-014**: The app MUST validate numeric workout entries and prevent clearly invalid values, including negative reps, negative weight, negative rest time, and effort values outside 1 to 10.
- **FR-015**: The app MUST provide a rest timer that can be started between logged sets and displays remaining rest time.
- **FR-016**: The app MUST allow users to finish a workout session and save it to history.
- **FR-016a**: Completed workout sessions MUST preserve the performed exercise names, targets, reps, weight, effort, and session date as they were recorded at completion time.
- **FR-017**: The app MUST preserve an interrupted active session so the user can resume or discard it after reopening the app.
- **FR-018**: The app MUST show exercise history including logged dates, reps, weight, and effort.
- **FR-019**: The app MUST show per-exercise progress including weight over time, total volume, and full session history with reps and weight.
- **FR-019a**: The app MUST NOT calculate or highlight highest weight or one-rep max records in v1.
- **FR-020**: The app MUST keep profile, exercise library, workouts, sessions, and history available without network access on a single device.
- **FR-021**: The app MUST exclude social features, nutrition tracking, wearable sync, accounts, and cross-device synchronization from v1.
- **FR-022**: User-facing labels and instructions MUST use beginner-friendly language and avoid unexplained advanced training terminology.

### Key Entities

- **Profile**: The user's personal context, including name, bodyweight, weight unit, experience level, and goals.
- **Exercise**: A preloaded movement in the library, including name, muscle group, picture, short instructions, and warmup status.
- **Workout**: A reusable routine made from ordered workout exercises; may be preloaded as a sample or created by the user.
- **Workout Exercise**: An exercise inside a workout with target sets, target reps, and target rest duration.
- **Workout Session**: A started instance of a workout with date, status, logged sets, completion state, and a completed-session snapshot of performed details.
- **Logged Set**: A recorded set within a session, including actual reps, weight, effort, and exercise reference.
- **Exercise Progress**: A derived view of an exercise's historical performance, including weight trend, volume, and full session history with reps and weight.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can create a profile and reach a useful starter workout in under 3 minutes.
- **SC-002**: A user can create a custom workout with 3 exercises and targets in under 5 minutes.
- **SC-003**: A user can log a 3-exercise workout session, including reps, weight, effort, and rest periods, without leaving the session flow.
- **SC-004**: 100% of core flows for setup, browsing exercises, creating workouts, logging sessions, and viewing history remain usable without network access on the same device.
- **SC-005**: After closing and reopening the app, 100% of saved profiles, custom workouts, completed sessions, and exercise history remain available.
- **SC-006**: A user can identify an exercise's muscle group, image, instructions, and warmup status within 10 seconds of opening its detail view.
- **SC-007**: A user can view progress for a previously logged exercise, including weight history, total volume, and full session set details, in no more than 3 navigation steps from the main workout area.
- **SC-008**: At least 90% of beginner usability test participants can complete profile setup and start a sample workout without external instructions.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than advanced training analytics.
- Features are local-only by default unless remote sync or accounts are explicitly requested and justified in a later version.
- v1 supports a single user profile on one device.
- Bodyweight and lifted weight use the user's chosen unit consistently across profile, workout logging, and progress displays.
- The preloaded exercise library contains only the exercises needed to support the three sample workouts; users can still build custom workouts from those exercises.
- Exercise images may be bundled starter images or placeholders, but every exercise must present a visual area so the library never appears broken.
- Progress views emphasize full logged session details and simple volume summaries, not record calculations.
