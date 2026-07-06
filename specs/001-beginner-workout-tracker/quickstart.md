# Quickstart: Beginner Workout Tracker Validation

## Prerequisites

- Node.js LTS
- Expo-compatible iOS or Android simulator, or Expo Go/device workflow
- Package manager selected by the implementation

## Setup

```bash
npm install
```

If the implementation includes a seed preparation command, run it before the
first app launch:

```bash
npm run seed:exercises
```

Expected seed behavior:
- Uses wger only as the seed-data source.
- Downloads/records selected starter exercise assets for bundling.
- Does not require network at app runtime for starter content.

## Run App

```bash
npm run start
```

Open the app in an iOS or Android target.

## Validation Scenarios

## Offline End-to-End Checklist

Use this checklist for the Phase 8 fresh-install validation pass.

- Reset the app data or install a fresh build.
- Enable airplane mode before launching the app.
- Launch the app and confirm the profile setup screen appears without network errors.
- Save a profile with name, bodyweight, weight unit, experience level, and goal.
- Confirm Workouts shows exactly three sample templates: Full Body A, Full Body B, and Full Body C.
- Open each sample workout and confirm it contains exercises with targets and rest times.
- Open Exercise library, switch muscle groups, and open at least one exercise detail screen.
- Confirm every exercise card/detail uses a local image or local placeholder state.
- Start a sample workout, log reps, weight, and RPE for at least one set, adjust or skip the rest timer, then finish the session.
- Restart the app and confirm no active-session prompt remains after finishing.
- Start another session, log one set, close the app, reopen, and confirm the home screen offers resume and discard.
- Create a custom workout from seeded exercises, save it, restart, and confirm it persists.
- Open progress for a completed exercise and confirm session history, set history, weight trend, and volume trend are visible.
- Confirm highest-weight and one-rep-max records are not shown.

### 1. First Launch Offline

1. Install or reset app data.
2. Disable network access.
3. Launch the app.
4. Create a profile with name, bodyweight, `kg` or `lb`, experience level, and goal.
5. Open workouts.

Expected:
- Profile saves successfully.
- Three sample workouts are visible.
- Seed exercise images or placeholders are visible.
- No network error blocks the flow.

Profile phase validation notes:
- Leave name or bodyweight blank and confirm inline errors appear.
- Switch between `kg` and `lb`, save, restart the app, and confirm the selected
  unit is still shown when editing the profile.
- Height can be left blank; if entered, it must be greater than 0.

### 2. Browse Exercise Library

1. Open the exercise library.
2. Filter or browse by muscle group.
3. Open an exercise detail screen.

Expected:
- Exercises are grouped by beginner muscle groups.
- Detail screen shows image/placeholder, instructions, equipment, and warmup
  status.

### 3. Copy Sample Workout

1. Open a sample workout.
2. Choose edit/customize.
3. Confirm a copy is created.
4. Change the copied workout name or targets.
5. Return to the sample workout.

Expected:
- The original sample workout remains unchanged.
- The copied workout is user-owned and editable.

### 4. Create Custom Workout

1. Create a new workout.
2. Add at least three seeded exercises.
3. Set target sets, rep range, and rest time.
4. Save the workout.
5. Restart the app.

Expected:
- Workout remains available and startable after restart.
- Empty workouts cannot be started.

### 5. Log Workout Session

1. Start a sample or custom workout.
2. Log multiple sets with reps, weight, and RPE 1-10.
3. Start the rest timer after a set.
4. Background and resume the app during rest.
5. Finish the session.

Expected:
- Set logs save successfully.
- Rest timer remains understandable after resume.
- Finished session appears in history.

### 6. Resume Interrupted Session

1. Start a workout session.
2. Log at least one set.
3. Close the app before finishing.
4. Reopen the app.

Expected:
- App offers resume or discard.
- Resuming preserves logged set data.

### 7. Exercise History

1. Complete two sessions containing the same exercise.
2. Open that exercise's progress/history screen.

Expected:
- Full session history shows set dates, reps, weight, and effort.
- Volume and weight-over-time views are present.
- Highest weight and one-rep max are not shown.

### 8. Completed Session Snapshot

1. Complete a workout session.
2. Edit the source workout or copied workout name/targets.
3. Reopen the completed session/history.

Expected:
- Completed session still shows original performed details.

## Suggested Test Commands

```bash
npm run lint
npm test
```

Add implementation-specific integration test commands once the Expo/SQLite test
harness is in place.
