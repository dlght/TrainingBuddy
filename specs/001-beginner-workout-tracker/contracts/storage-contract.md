# Contract: Local Storage Behavior

## Purpose

Define the observable persistence contract for local profile, exercises,
workouts, sessions, set logs, and progress views.

## General Rules

- SQLite is the durable source of truth.
- Startup MUST run migrations before reading feature data.
- Startup MUST seed required starter content when the seed version has not been
  applied.
- Seed replay MUST NOT overwrite user-created workouts, copied sample workouts,
  or completed sessions.
- Core flows MUST be usable without network access.

## Profile Contract

Create/update profile requires:
- name
- bodyweight
- weight unit: `kg` or `lb`
- experience level
- goal

Expected behavior:
- Profile persists after app restart.
- Weight unit is used consistently for bodyweight, set logging, and progress.

## Workout Template Contract

Sample workouts:
- Have `user_id = null`.
- Have `is_template = true`.
- Cannot be edited directly.
- Can be started directly.
- Can be copied into user-owned workouts for editing.

Custom workouts:
- Have `user_id` set.
- Can be created, edited, renamed, and deleted.
- Cannot be started with zero exercises.

## Session Contract

Starting a workout:
- Creates one active WorkoutSession.
- Copies workout name into `workout_name_snapshot`.
- Presents ordered WorkoutExercises with targets.

Logging a set:
- Requires reps, weight, effort RPE, and set number.
- Rejects negative reps or weight.
- Rejects RPE outside 1-10.
- Saves completed timestamp.
- Saves performed exercise details needed for stable history.

Finishing a session:
- Sets `ended_at`.
- Sets status to `completed`.
- Preserves performed details even if workouts or exercises are edited later.

Interrupted session:
- Reopening the app offers resume or discard.
- Completed and discarded sessions are terminal.

## Progress Contract

For each exercise:
- Show completed session dates.
- Show all logged sets with reps, weight, and effort.
- Show total volume per session as reps * weight.
- Show weight over time.
- Do not calculate or highlight highest weight or one-rep max in v1.

## Offline Validation

The following must pass with network disabled:
- First launch after install
- Profile setup
- Exercise library browsing
- Sample workout start
- Custom workout creation from seeded exercises
- Session logging and finish
- App restart with profile/workout/session/history retained
